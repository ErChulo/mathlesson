export type RendererLifecycleInstance<TInstance> = {
  adapterId: string;
  sourceKey: string;
  instance: TInstance;
};

export function createLifecycleInstance<TInstance>(
  adapterId: string,
  sourceKey: string,
  instance: TInstance,
): RendererLifecycleInstance<TInstance> {
  return { adapterId, sourceKey, instance };
}

export function hasSameLifecycleSource<TInstance>(
  current: RendererLifecycleInstance<TInstance> | null,
  adapterId: string,
  sourceKey: string,
): boolean {
  return current?.adapterId === adapterId && current.sourceKey === sourceKey;
}
