import * as Y from 'yjs'

export const LOCAL_ORIGIN = 'scrawler-local'

export function localTransact(doc: Y.Doc, fn: () => void) {
  doc.transact(fn, LOCAL_ORIGIN)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeUndoManager(shapesMap: Y.AbstractType<any>): Y.UndoManager {
  return new Y.UndoManager(shapesMap, {
    trackedOrigins: new Set([LOCAL_ORIGIN]),
  })
}
