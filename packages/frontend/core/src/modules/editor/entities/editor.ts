import type { DefaultOpenProperty } from '@affine/core/components/doc-properties';
import {
  type DocMode,
  EdgelessRootService,
  type ReferenceParams,
} from '@blocksuite/affine/blocks';
import type {
  AffineEditorContainer,
  DocTitle,
} from '@blocksuite/affine/presets';
import type { InlineEditor } from '@blocksuite/inline';
import { effect } from '@preact/signals-core';
import type { DocService, WorkspaceService } from '@toeverything/infra';
import { Entity, LiveData } from '@toeverything/infra';
import { defaults, isEqual, omit } from 'lodash-es';
import { skip } from 'rxjs';

import { paramsParseOptions, preprocessParams } from '../../navigation/utils';
import type { WorkbenchView } from '../../workbench';
import { EditorScope } from '../scopes/editor';
import type { EditorSelector } from '../types';

export class Editor extends Entity {
  readonly scope = this.framework.createScope(EditorScope, {
    editor: this as Editor,
  });

  readonly mode$ = new LiveData<DocMode>('page');
  readonly selector$ = new LiveData<EditorSelector | undefined>(undefined);
  readonly doc = this.docService.doc;
  readonly isSharedMode =
    this.workspaceService.workspace.openOptions.isSharedMode;

  readonly editorContainer$ = new LiveData<AffineEditorContainer | null>(null);
  readonly defaultOpenProperty$ = new LiveData<DefaultOpenProperty | undefined>(
    undefined
  );
  workbenchView: WorkbenchView | null = null;
  defaultScrollPosition:
    | number
    | {
        centerX: number;
        centerY: number;
        zoom: number;
      }
    | null = null;

  private readonly focusAt$ = LiveData.computed(get => {
    const selector = get(this.selector$);
    const mode = get(this.mode$);
    let id = selector?.blockIds?.[0];
    let key = 'blockIds';

    if (mode === 'edgeless') {
      const elementId = selector?.elementIds?.[0];
      if (elementId) {
        id = elementId;
        key = 'elementIds';
      }
    }

    if (!id) return null;

    return { id, key, mode, refreshKey: selector?.refreshKey };
  });

  isPresenting$ = new LiveData<boolean>(false);

  togglePresentation() {
    const edgelessRootService =
      this.editorContainer$.value?.host?.std.getService(
        'affine:page'
      ) as EdgelessRootService;
    if (!edgelessRootService) return;

    edgelessRootService.gfx.tool.setTool({
      type: !this.isPresenting$.value ? 'frameNavigator' : 'default',
    });
  }

  setSelector(selector: EditorSelector | undefined) {
    this.selector$.next(selector);
  }

  toggleMode() {
    this.mode$.next(this.mode$.value === 'edgeless' ? 'page' : 'edgeless');
  }

  setMode(mode: DocMode) {
    this.mode$.next(mode);
  }

  setDefaultOpenProperty(defaultOpenProperty: DefaultOpenProperty | undefined) {
    this.defaultOpenProperty$.next(defaultOpenProperty);
  }

  /**
   * sync editor params with view query string
   */
  bindWorkbenchView(view: WorkbenchView) {
    if (this.workbenchView) {
      throw new Error('already bound');
    }
    this.workbenchView = view;
    this.defaultScrollPosition = view.getScrollPosition() ?? null;

    const stablePrimaryMode = this.doc.getPrimaryMode();

    // eslint-disable-next-line rxjs/finnish
    const viewParams$ = view
      .queryString$<ReferenceParams & { refreshKey?: string }>(
        paramsParseOptions
      )
      .map(preprocessParams)
      .map(params =>
        defaults(params, {
          mode: stablePrimaryMode || ('page' as DocMode),
        })
      );

    const editorParams$ = LiveData.computed(get => {
      return {
        mode: get(this.mode$),
        ...get(this.selector$),
      };
    });

    // prevent infinite loop
    let updating = false;

    const unsubscribeViewParams = viewParams$.subscribe(params => {
      if (updating) return;
      updating = true;
      // when view params changed, sync to editor
      try {
        const editorParams = editorParams$.value;
        if (params.mode !== editorParams.mode) {
          this.setMode(params.mode);
        }

        const selector = omit(params, ['mode']);
        if (!isEqual(selector, omit(editorParams, ['mode']))) {
          this.setSelector(selector);
        }

        if (params.databaseId && params.databaseRowId) {
          const defaultOpenProperty: DefaultOpenProperty = {
            type: 'database',
            databaseId: params.databaseId,
            databaseRowId: params.databaseRowId,
          };
          if (!isEqual(defaultOpenProperty, this.defaultOpenProperty$.value)) {
            this.setDefaultOpenProperty(defaultOpenProperty);
          }
        }
      } finally {
        updating = false;
      }
    });

    const unsubscribeEditorParams = editorParams$.subscribe(params => {
      if (updating) return;
      updating = true;
      try {
        // when editor params changed, sync to view
        if (!isEqual(params, viewParams$.value)) {
          const newQueryString: Record<string, string> = {};

          Object.entries(params).forEach(([k, v]) => {
            newQueryString[k] = Array.isArray(v) ? v.join(',') : v;
          });

          view.updateQueryString(newQueryString, { replace: true });
        }
      } finally {
        updating = false;
      }
    });

    return () => {
      this.workbenchView = null;
      unsubscribeEditorParams.unsubscribe();
      unsubscribeViewParams.unsubscribe();
    };
  }

  bindEditorContainer(
    editorContainer: AffineEditorContainer,
    docTitle?: DocTitle | null,
    scrollViewport?: HTMLElement | null
  ) {
    if (this.editorContainer$.value) {
      throw new Error('already bound');
    }
    this.editorContainer$.next(editorContainer);
    const unsubs: (() => void)[] = [];

    const rootService = editorContainer.host?.std.getService('affine:page');

    // ----- Scroll Position and Selection -----
    if (this.defaultScrollPosition) {
      // if we have default scroll position, we should restore it
      if (
        this.mode$.value === 'page' &&
        typeof this.defaultScrollPosition === 'number'
      ) {
        scrollViewport?.scrollTo(0, this.defaultScrollPosition || 0);
      } else if (
        this.mode$.value === 'edgeless' &&
        typeof this.defaultScrollPosition === 'object' &&
        rootService instanceof EdgelessRootService
      ) {
        rootService.viewport.setViewport(this.defaultScrollPosition.zoom, [
          this.defaultScrollPosition.centerX,
          this.defaultScrollPosition.centerY,
        ]);
      }

      this.defaultScrollPosition = null; // reset default scroll position
    } else {
      const initialFocusAt = this.focusAt$.value;

      if (initialFocusAt === null) {
        const title = docTitle?.querySelector<
          HTMLElement & { inlineEditor: InlineEditor | null }
        >('rich-text');
        title?.inlineEditor?.focusEnd();
      } else {
        const selection = editorContainer.host?.std.selection;

        const { id, key, mode } = initialFocusAt;

        if (mode === this.mode$.value) {
          selection?.setGroup('scene', [
            selection?.create('highlight', {
              mode,
              [key]: [id],
            }),
          ]);
        }
      }
    }

    // update scroll position when scrollViewport scroll
    const saveScrollPosition = () => {
      if (this.mode$.value === 'page' && scrollViewport) {
        this.workbenchView?.setScrollPosition(scrollViewport.scrollTop);
      } else if (
        this.mode$.value === 'edgeless' &&
        rootService instanceof EdgelessRootService
      ) {
        this.workbenchView?.setScrollPosition({
          centerX: rootService.viewport.centerX,
          centerY: rootService.viewport.centerY,
          zoom: rootService.viewport.zoom,
        });
      }
    };
    scrollViewport?.addEventListener('scroll', saveScrollPosition);
    unsubs.push(() => {
      scrollViewport?.removeEventListener('scroll', saveScrollPosition);
    });
    if (rootService instanceof EdgelessRootService) {
      unsubs.push(
        rootService.viewport.viewportUpdated.on(saveScrollPosition).dispose
      );
    }

    // update selection when focusAt$ changed
    const subscription = this.focusAt$
      .distinctUntilChanged(
        (a, b) =>
          a?.id === b?.id &&
          a?.key === b?.key &&
          a?.refreshKey === b?.refreshKey
      )
      .pipe(skip(1))
      .subscribe(anchor => {
        if (!anchor) return;

        const selection = editorContainer.host?.std.selection;
        if (!selection) return;

        const { id, key, mode } = anchor;

        selection.setGroup('scene', [
          selection.create('highlight', {
            mode,
            [key]: [id],
          }),
        ]);
      });
    unsubs.push(subscription.unsubscribe.bind(subscription));

    // ----- Presenting -----
    const edgelessPage = editorContainer.host?.querySelector(
      'affine-edgeless-root'
    );
    if (!edgelessPage) {
      this.isPresenting$.next(false);
    } else {
      this.isPresenting$.next(
        edgelessPage.gfx.tool.currentToolName$.peek() === 'frameNavigator'
      );

      const disposable = effect(() => {
        this.isPresenting$.next(
          edgelessPage.gfx.tool.currentToolName$.value === 'frameNavigator'
        );
      });
      unsubs.push(disposable);
    }

    return () => {
      this.editorContainer$.next(null);
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }

  constructor(
    private readonly docService: DocService,
    private readonly workspaceService: WorkspaceService
  ) {
    super();
  }
}
