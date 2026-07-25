declare module 'class-transformer' {
  export function Type(typeFn: () => new (...args: any[]) => any): PropertyDecorator;
  export function Transform(transformFn: (params: { value: any; key: string; obj: any; type: any }) => any, options?: any): PropertyDecorator;
  export function plainToInstance<T, V>(cls: new (...args: any[]) => T, plain: V[], options?: any): T[];
  export function plainToInstance<T, V>(cls: new (...args: any[]) => T, plain: V, options?: any): T;
  export function instanceToPlain(obj: any, options?: any): any;
  export function classToPlain(obj: any, options?: any): any;
  export function Expose(options?: any): PropertyDecorator;
  export function Exclude(options?: any): PropertyDecorator;
  export function TransformPlainToInstance(cls: new (...args: any[]) => any): MethodDecorator;
}
