
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Course
 * 
 */
export type Course = $Result.DefaultSelection<Prisma.$CoursePayload>
/**
 * Model Period
 * 
 */
export type Period = $Result.DefaultSelection<Prisma.$PeriodPayload>
/**
 * Model Enrollment
 * 
 */
export type Enrollment = $Result.DefaultSelection<Prisma.$EnrollmentPayload>
/**
 * Model Class
 * 
 */
export type Class = $Result.DefaultSelection<Prisma.$ClassPayload>
/**
 * Model Slide
 * 
 */
export type Slide = $Result.DefaultSelection<Prisma.$SlidePayload>
/**
 * Model GradebookStructure
 * 
 */
export type GradebookStructure = $Result.DefaultSelection<Prisma.$GradebookStructurePayload>
/**
 * Model Aspect
 * 
 */
export type Aspect = $Result.DefaultSelection<Prisma.$AspectPayload>
/**
 * Model Indicator
 * 
 */
export type Indicator = $Result.DefaultSelection<Prisma.$IndicatorPayload>
/**
 * Model Activity
 * 
 */
export type Activity = $Result.DefaultSelection<Prisma.$ActivityPayload>
/**
 * Model GradeEntry
 * 
 */
export type GradeEntry = $Result.DefaultSelection<Prisma.$GradeEntryPayload>
/**
 * Model SelfEvaluation
 * 
 */
export type SelfEvaluation = $Result.DefaultSelection<Prisma.$SelfEvaluationPayload>
/**
 * Model PeerEvaluation
 * 
 */
export type PeerEvaluation = $Result.DefaultSelection<Prisma.$PeerEvaluationPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  TEACHER: 'TEACHER',
  TEACHER_ASSISTANT: 'TEACHER_ASSISTANT',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  GUEST: 'GUEST'
};

export type Role = (typeof Role)[keyof typeof Role]


export const ClassStatus: {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  LIVE: 'LIVE',
  ARCHIVED: 'ARCHIVED'
};

export type ClassStatus = (typeof ClassStatus)[keyof typeof ClassStatus]


export const SlideType: {
  COVER: 'COVER',
  CONTENT: 'CONTENT',
  ACTIVITY: 'ACTIVITY',
  VIDEO: 'VIDEO',
  IMAGE: 'IMAGE'
};

export type SlideType = (typeof SlideType)[keyof typeof SlideType]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type ClassStatus = $Enums.ClassStatus

export const ClassStatus: typeof $Enums.ClassStatus

export type SlideType = $Enums.SlideType

export const SlideType: typeof $Enums.SlideType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.course`: Exposes CRUD operations for the **Course** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Courses
    * const courses = await prisma.course.findMany()
    * ```
    */
  get course(): Prisma.CourseDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.period`: Exposes CRUD operations for the **Period** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Periods
    * const periods = await prisma.period.findMany()
    * ```
    */
  get period(): Prisma.PeriodDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.enrollment`: Exposes CRUD operations for the **Enrollment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Enrollments
    * const enrollments = await prisma.enrollment.findMany()
    * ```
    */
  get enrollment(): Prisma.EnrollmentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.class`: Exposes CRUD operations for the **Class** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Classes
    * const classes = await prisma.class.findMany()
    * ```
    */
  get class(): Prisma.ClassDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.slide`: Exposes CRUD operations for the **Slide** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Slides
    * const slides = await prisma.slide.findMany()
    * ```
    */
  get slide(): Prisma.SlideDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.gradebookStructure`: Exposes CRUD operations for the **GradebookStructure** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GradebookStructures
    * const gradebookStructures = await prisma.gradebookStructure.findMany()
    * ```
    */
  get gradebookStructure(): Prisma.GradebookStructureDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.aspect`: Exposes CRUD operations for the **Aspect** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Aspects
    * const aspects = await prisma.aspect.findMany()
    * ```
    */
  get aspect(): Prisma.AspectDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.indicator`: Exposes CRUD operations for the **Indicator** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Indicators
    * const indicators = await prisma.indicator.findMany()
    * ```
    */
  get indicator(): Prisma.IndicatorDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.activity`: Exposes CRUD operations for the **Activity** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Activities
    * const activities = await prisma.activity.findMany()
    * ```
    */
  get activity(): Prisma.ActivityDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.gradeEntry`: Exposes CRUD operations for the **GradeEntry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GradeEntries
    * const gradeEntries = await prisma.gradeEntry.findMany()
    * ```
    */
  get gradeEntry(): Prisma.GradeEntryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.selfEvaluation`: Exposes CRUD operations for the **SelfEvaluation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SelfEvaluations
    * const selfEvaluations = await prisma.selfEvaluation.findMany()
    * ```
    */
  get selfEvaluation(): Prisma.SelfEvaluationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.peerEvaluation`: Exposes CRUD operations for the **PeerEvaluation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PeerEvaluations
    * const peerEvaluations = await prisma.peerEvaluation.findMany()
    * ```
    */
  get peerEvaluation(): Prisma.PeerEvaluationDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.5.0
   * Query Engine version: 280c870be64f457428992c43c1f6d557fab6e29e
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Course: 'Course',
    Period: 'Period',
    Enrollment: 'Enrollment',
    Class: 'Class',
    Slide: 'Slide',
    GradebookStructure: 'GradebookStructure',
    Aspect: 'Aspect',
    Indicator: 'Indicator',
    Activity: 'Activity',
    GradeEntry: 'GradeEntry',
    SelfEvaluation: 'SelfEvaluation',
    PeerEvaluation: 'PeerEvaluation'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "course" | "period" | "enrollment" | "class" | "slide" | "gradebookStructure" | "aspect" | "indicator" | "activity" | "gradeEntry" | "selfEvaluation" | "peerEvaluation"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Course: {
        payload: Prisma.$CoursePayload<ExtArgs>
        fields: Prisma.CourseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CourseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CourseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          findFirst: {
            args: Prisma.CourseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CourseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          findMany: {
            args: Prisma.CourseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>[]
          }
          create: {
            args: Prisma.CourseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          createMany: {
            args: Prisma.CourseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CourseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>[]
          }
          delete: {
            args: Prisma.CourseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          update: {
            args: Prisma.CourseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          deleteMany: {
            args: Prisma.CourseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CourseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CourseUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>[]
          }
          upsert: {
            args: Prisma.CourseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          aggregate: {
            args: Prisma.CourseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCourse>
          }
          groupBy: {
            args: Prisma.CourseGroupByArgs<ExtArgs>
            result: $Utils.Optional<CourseGroupByOutputType>[]
          }
          count: {
            args: Prisma.CourseCountArgs<ExtArgs>
            result: $Utils.Optional<CourseCountAggregateOutputType> | number
          }
        }
      }
      Period: {
        payload: Prisma.$PeriodPayload<ExtArgs>
        fields: Prisma.PeriodFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PeriodFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PeriodFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload>
          }
          findFirst: {
            args: Prisma.PeriodFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PeriodFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload>
          }
          findMany: {
            args: Prisma.PeriodFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload>[]
          }
          create: {
            args: Prisma.PeriodCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload>
          }
          createMany: {
            args: Prisma.PeriodCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PeriodCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload>[]
          }
          delete: {
            args: Prisma.PeriodDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload>
          }
          update: {
            args: Prisma.PeriodUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload>
          }
          deleteMany: {
            args: Prisma.PeriodDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PeriodUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PeriodUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload>[]
          }
          upsert: {
            args: Prisma.PeriodUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeriodPayload>
          }
          aggregate: {
            args: Prisma.PeriodAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePeriod>
          }
          groupBy: {
            args: Prisma.PeriodGroupByArgs<ExtArgs>
            result: $Utils.Optional<PeriodGroupByOutputType>[]
          }
          count: {
            args: Prisma.PeriodCountArgs<ExtArgs>
            result: $Utils.Optional<PeriodCountAggregateOutputType> | number
          }
        }
      }
      Enrollment: {
        payload: Prisma.$EnrollmentPayload<ExtArgs>
        fields: Prisma.EnrollmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EnrollmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EnrollmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload>
          }
          findFirst: {
            args: Prisma.EnrollmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EnrollmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload>
          }
          findMany: {
            args: Prisma.EnrollmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload>[]
          }
          create: {
            args: Prisma.EnrollmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload>
          }
          createMany: {
            args: Prisma.EnrollmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EnrollmentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload>[]
          }
          delete: {
            args: Prisma.EnrollmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload>
          }
          update: {
            args: Prisma.EnrollmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload>
          }
          deleteMany: {
            args: Prisma.EnrollmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EnrollmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EnrollmentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload>[]
          }
          upsert: {
            args: Prisma.EnrollmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EnrollmentPayload>
          }
          aggregate: {
            args: Prisma.EnrollmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEnrollment>
          }
          groupBy: {
            args: Prisma.EnrollmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<EnrollmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.EnrollmentCountArgs<ExtArgs>
            result: $Utils.Optional<EnrollmentCountAggregateOutputType> | number
          }
        }
      }
      Class: {
        payload: Prisma.$ClassPayload<ExtArgs>
        fields: Prisma.ClassFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ClassFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ClassFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload>
          }
          findFirst: {
            args: Prisma.ClassFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ClassFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload>
          }
          findMany: {
            args: Prisma.ClassFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload>[]
          }
          create: {
            args: Prisma.ClassCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload>
          }
          createMany: {
            args: Prisma.ClassCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ClassCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload>[]
          }
          delete: {
            args: Prisma.ClassDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload>
          }
          update: {
            args: Prisma.ClassUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload>
          }
          deleteMany: {
            args: Prisma.ClassDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ClassUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ClassUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload>[]
          }
          upsert: {
            args: Prisma.ClassUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClassPayload>
          }
          aggregate: {
            args: Prisma.ClassAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateClass>
          }
          groupBy: {
            args: Prisma.ClassGroupByArgs<ExtArgs>
            result: $Utils.Optional<ClassGroupByOutputType>[]
          }
          count: {
            args: Prisma.ClassCountArgs<ExtArgs>
            result: $Utils.Optional<ClassCountAggregateOutputType> | number
          }
        }
      }
      Slide: {
        payload: Prisma.$SlidePayload<ExtArgs>
        fields: Prisma.SlideFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SlideFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SlideFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload>
          }
          findFirst: {
            args: Prisma.SlideFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SlideFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload>
          }
          findMany: {
            args: Prisma.SlideFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload>[]
          }
          create: {
            args: Prisma.SlideCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload>
          }
          createMany: {
            args: Prisma.SlideCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SlideCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload>[]
          }
          delete: {
            args: Prisma.SlideDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload>
          }
          update: {
            args: Prisma.SlideUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload>
          }
          deleteMany: {
            args: Prisma.SlideDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SlideUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SlideUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload>[]
          }
          upsert: {
            args: Prisma.SlideUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SlidePayload>
          }
          aggregate: {
            args: Prisma.SlideAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSlide>
          }
          groupBy: {
            args: Prisma.SlideGroupByArgs<ExtArgs>
            result: $Utils.Optional<SlideGroupByOutputType>[]
          }
          count: {
            args: Prisma.SlideCountArgs<ExtArgs>
            result: $Utils.Optional<SlideCountAggregateOutputType> | number
          }
        }
      }
      GradebookStructure: {
        payload: Prisma.$GradebookStructurePayload<ExtArgs>
        fields: Prisma.GradebookStructureFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GradebookStructureFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GradebookStructureFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload>
          }
          findFirst: {
            args: Prisma.GradebookStructureFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GradebookStructureFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload>
          }
          findMany: {
            args: Prisma.GradebookStructureFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload>[]
          }
          create: {
            args: Prisma.GradebookStructureCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload>
          }
          createMany: {
            args: Prisma.GradebookStructureCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GradebookStructureCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload>[]
          }
          delete: {
            args: Prisma.GradebookStructureDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload>
          }
          update: {
            args: Prisma.GradebookStructureUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload>
          }
          deleteMany: {
            args: Prisma.GradebookStructureDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GradebookStructureUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GradebookStructureUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload>[]
          }
          upsert: {
            args: Prisma.GradebookStructureUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradebookStructurePayload>
          }
          aggregate: {
            args: Prisma.GradebookStructureAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGradebookStructure>
          }
          groupBy: {
            args: Prisma.GradebookStructureGroupByArgs<ExtArgs>
            result: $Utils.Optional<GradebookStructureGroupByOutputType>[]
          }
          count: {
            args: Prisma.GradebookStructureCountArgs<ExtArgs>
            result: $Utils.Optional<GradebookStructureCountAggregateOutputType> | number
          }
        }
      }
      Aspect: {
        payload: Prisma.$AspectPayload<ExtArgs>
        fields: Prisma.AspectFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AspectFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AspectFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload>
          }
          findFirst: {
            args: Prisma.AspectFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AspectFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload>
          }
          findMany: {
            args: Prisma.AspectFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload>[]
          }
          create: {
            args: Prisma.AspectCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload>
          }
          createMany: {
            args: Prisma.AspectCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AspectCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload>[]
          }
          delete: {
            args: Prisma.AspectDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload>
          }
          update: {
            args: Prisma.AspectUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload>
          }
          deleteMany: {
            args: Prisma.AspectDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AspectUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AspectUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload>[]
          }
          upsert: {
            args: Prisma.AspectUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AspectPayload>
          }
          aggregate: {
            args: Prisma.AspectAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAspect>
          }
          groupBy: {
            args: Prisma.AspectGroupByArgs<ExtArgs>
            result: $Utils.Optional<AspectGroupByOutputType>[]
          }
          count: {
            args: Prisma.AspectCountArgs<ExtArgs>
            result: $Utils.Optional<AspectCountAggregateOutputType> | number
          }
        }
      }
      Indicator: {
        payload: Prisma.$IndicatorPayload<ExtArgs>
        fields: Prisma.IndicatorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IndicatorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IndicatorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload>
          }
          findFirst: {
            args: Prisma.IndicatorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IndicatorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload>
          }
          findMany: {
            args: Prisma.IndicatorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload>[]
          }
          create: {
            args: Prisma.IndicatorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload>
          }
          createMany: {
            args: Prisma.IndicatorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IndicatorCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload>[]
          }
          delete: {
            args: Prisma.IndicatorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload>
          }
          update: {
            args: Prisma.IndicatorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload>
          }
          deleteMany: {
            args: Prisma.IndicatorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IndicatorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IndicatorUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload>[]
          }
          upsert: {
            args: Prisma.IndicatorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndicatorPayload>
          }
          aggregate: {
            args: Prisma.IndicatorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIndicator>
          }
          groupBy: {
            args: Prisma.IndicatorGroupByArgs<ExtArgs>
            result: $Utils.Optional<IndicatorGroupByOutputType>[]
          }
          count: {
            args: Prisma.IndicatorCountArgs<ExtArgs>
            result: $Utils.Optional<IndicatorCountAggregateOutputType> | number
          }
        }
      }
      Activity: {
        payload: Prisma.$ActivityPayload<ExtArgs>
        fields: Prisma.ActivityFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ActivityFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ActivityFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          findFirst: {
            args: Prisma.ActivityFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ActivityFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          findMany: {
            args: Prisma.ActivityFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>[]
          }
          create: {
            args: Prisma.ActivityCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          createMany: {
            args: Prisma.ActivityCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ActivityCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>[]
          }
          delete: {
            args: Prisma.ActivityDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          update: {
            args: Prisma.ActivityUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          deleteMany: {
            args: Prisma.ActivityDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ActivityUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ActivityUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>[]
          }
          upsert: {
            args: Prisma.ActivityUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityPayload>
          }
          aggregate: {
            args: Prisma.ActivityAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateActivity>
          }
          groupBy: {
            args: Prisma.ActivityGroupByArgs<ExtArgs>
            result: $Utils.Optional<ActivityGroupByOutputType>[]
          }
          count: {
            args: Prisma.ActivityCountArgs<ExtArgs>
            result: $Utils.Optional<ActivityCountAggregateOutputType> | number
          }
        }
      }
      GradeEntry: {
        payload: Prisma.$GradeEntryPayload<ExtArgs>
        fields: Prisma.GradeEntryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GradeEntryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GradeEntryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload>
          }
          findFirst: {
            args: Prisma.GradeEntryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GradeEntryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload>
          }
          findMany: {
            args: Prisma.GradeEntryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload>[]
          }
          create: {
            args: Prisma.GradeEntryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload>
          }
          createMany: {
            args: Prisma.GradeEntryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GradeEntryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload>[]
          }
          delete: {
            args: Prisma.GradeEntryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload>
          }
          update: {
            args: Prisma.GradeEntryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload>
          }
          deleteMany: {
            args: Prisma.GradeEntryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GradeEntryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GradeEntryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload>[]
          }
          upsert: {
            args: Prisma.GradeEntryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GradeEntryPayload>
          }
          aggregate: {
            args: Prisma.GradeEntryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGradeEntry>
          }
          groupBy: {
            args: Prisma.GradeEntryGroupByArgs<ExtArgs>
            result: $Utils.Optional<GradeEntryGroupByOutputType>[]
          }
          count: {
            args: Prisma.GradeEntryCountArgs<ExtArgs>
            result: $Utils.Optional<GradeEntryCountAggregateOutputType> | number
          }
        }
      }
      SelfEvaluation: {
        payload: Prisma.$SelfEvaluationPayload<ExtArgs>
        fields: Prisma.SelfEvaluationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SelfEvaluationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SelfEvaluationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload>
          }
          findFirst: {
            args: Prisma.SelfEvaluationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SelfEvaluationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload>
          }
          findMany: {
            args: Prisma.SelfEvaluationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload>[]
          }
          create: {
            args: Prisma.SelfEvaluationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload>
          }
          createMany: {
            args: Prisma.SelfEvaluationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SelfEvaluationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload>[]
          }
          delete: {
            args: Prisma.SelfEvaluationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload>
          }
          update: {
            args: Prisma.SelfEvaluationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload>
          }
          deleteMany: {
            args: Prisma.SelfEvaluationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SelfEvaluationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SelfEvaluationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload>[]
          }
          upsert: {
            args: Prisma.SelfEvaluationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SelfEvaluationPayload>
          }
          aggregate: {
            args: Prisma.SelfEvaluationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSelfEvaluation>
          }
          groupBy: {
            args: Prisma.SelfEvaluationGroupByArgs<ExtArgs>
            result: $Utils.Optional<SelfEvaluationGroupByOutputType>[]
          }
          count: {
            args: Prisma.SelfEvaluationCountArgs<ExtArgs>
            result: $Utils.Optional<SelfEvaluationCountAggregateOutputType> | number
          }
        }
      }
      PeerEvaluation: {
        payload: Prisma.$PeerEvaluationPayload<ExtArgs>
        fields: Prisma.PeerEvaluationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PeerEvaluationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PeerEvaluationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload>
          }
          findFirst: {
            args: Prisma.PeerEvaluationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PeerEvaluationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload>
          }
          findMany: {
            args: Prisma.PeerEvaluationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload>[]
          }
          create: {
            args: Prisma.PeerEvaluationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload>
          }
          createMany: {
            args: Prisma.PeerEvaluationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PeerEvaluationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload>[]
          }
          delete: {
            args: Prisma.PeerEvaluationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload>
          }
          update: {
            args: Prisma.PeerEvaluationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload>
          }
          deleteMany: {
            args: Prisma.PeerEvaluationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PeerEvaluationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PeerEvaluationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload>[]
          }
          upsert: {
            args: Prisma.PeerEvaluationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PeerEvaluationPayload>
          }
          aggregate: {
            args: Prisma.PeerEvaluationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePeerEvaluation>
          }
          groupBy: {
            args: Prisma.PeerEvaluationGroupByArgs<ExtArgs>
            result: $Utils.Optional<PeerEvaluationGroupByOutputType>[]
          }
          count: {
            args: Prisma.PeerEvaluationCountArgs<ExtArgs>
            result: $Utils.Optional<PeerEvaluationCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    course?: CourseOmit
    period?: PeriodOmit
    enrollment?: EnrollmentOmit
    class?: ClassOmit
    slide?: SlideOmit
    gradebookStructure?: GradebookStructureOmit
    aspect?: AspectOmit
    indicator?: IndicatorOmit
    activity?: ActivityOmit
    gradeEntry?: GradeEntryOmit
    selfEvaluation?: SelfEvaluationOmit
    peerEvaluation?: PeerEvaluationOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    teacherCourses: number
    enrollments: number
    gradebookEntries: number
    selfEvaluations: number
    peerEvaluationsGiven: number
    peerEvaluationsReceived: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    teacherCourses?: boolean | UserCountOutputTypeCountTeacherCoursesArgs
    enrollments?: boolean | UserCountOutputTypeCountEnrollmentsArgs
    gradebookEntries?: boolean | UserCountOutputTypeCountGradebookEntriesArgs
    selfEvaluations?: boolean | UserCountOutputTypeCountSelfEvaluationsArgs
    peerEvaluationsGiven?: boolean | UserCountOutputTypeCountPeerEvaluationsGivenArgs
    peerEvaluationsReceived?: boolean | UserCountOutputTypeCountPeerEvaluationsReceivedArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountTeacherCoursesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountEnrollmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EnrollmentWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountGradebookEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GradeEntryWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSelfEvaluationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SelfEvaluationWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPeerEvaluationsGivenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PeerEvaluationWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPeerEvaluationsReceivedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PeerEvaluationWhereInput
  }


  /**
   * Count Type CourseCountOutputType
   */

  export type CourseCountOutputType = {
    enrollments: number
    classes: number
    periods: number
  }

  export type CourseCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    enrollments?: boolean | CourseCountOutputTypeCountEnrollmentsArgs
    classes?: boolean | CourseCountOutputTypeCountClassesArgs
    periods?: boolean | CourseCountOutputTypeCountPeriodsArgs
  }

  // Custom InputTypes
  /**
   * CourseCountOutputType without action
   */
  export type CourseCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseCountOutputType
     */
    select?: CourseCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CourseCountOutputType without action
   */
  export type CourseCountOutputTypeCountEnrollmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EnrollmentWhereInput
  }

  /**
   * CourseCountOutputType without action
   */
  export type CourseCountOutputTypeCountClassesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ClassWhereInput
  }

  /**
   * CourseCountOutputType without action
   */
  export type CourseCountOutputTypeCountPeriodsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PeriodWhereInput
  }


  /**
   * Count Type PeriodCountOutputType
   */

  export type PeriodCountOutputType = {
    gradeEntries: number
  }

  export type PeriodCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gradeEntries?: boolean | PeriodCountOutputTypeCountGradeEntriesArgs
  }

  // Custom InputTypes
  /**
   * PeriodCountOutputType without action
   */
  export type PeriodCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeriodCountOutputType
     */
    select?: PeriodCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PeriodCountOutputType without action
   */
  export type PeriodCountOutputTypeCountGradeEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GradeEntryWhereInput
  }


  /**
   * Count Type ClassCountOutputType
   */

  export type ClassCountOutputType = {
    slides: number
  }

  export type ClassCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    slides?: boolean | ClassCountOutputTypeCountSlidesArgs
  }

  // Custom InputTypes
  /**
   * ClassCountOutputType without action
   */
  export type ClassCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClassCountOutputType
     */
    select?: ClassCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ClassCountOutputType without action
   */
  export type ClassCountOutputTypeCountSlidesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SlideWhereInput
  }


  /**
   * Count Type GradebookStructureCountOutputType
   */

  export type GradebookStructureCountOutputType = {
    aspects: number
  }

  export type GradebookStructureCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aspects?: boolean | GradebookStructureCountOutputTypeCountAspectsArgs
  }

  // Custom InputTypes
  /**
   * GradebookStructureCountOutputType without action
   */
  export type GradebookStructureCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructureCountOutputType
     */
    select?: GradebookStructureCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * GradebookStructureCountOutputType without action
   */
  export type GradebookStructureCountOutputTypeCountAspectsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AspectWhereInput
  }


  /**
   * Count Type AspectCountOutputType
   */

  export type AspectCountOutputType = {
    indicators: number
  }

  export type AspectCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    indicators?: boolean | AspectCountOutputTypeCountIndicatorsArgs
  }

  // Custom InputTypes
  /**
   * AspectCountOutputType without action
   */
  export type AspectCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AspectCountOutputType
     */
    select?: AspectCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AspectCountOutputType without action
   */
  export type AspectCountOutputTypeCountIndicatorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IndicatorWhereInput
  }


  /**
   * Count Type IndicatorCountOutputType
   */

  export type IndicatorCountOutputType = {
    activities: number
  }

  export type IndicatorCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    activities?: boolean | IndicatorCountOutputTypeCountActivitiesArgs
  }

  // Custom InputTypes
  /**
   * IndicatorCountOutputType without action
   */
  export type IndicatorCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndicatorCountOutputType
     */
    select?: IndicatorCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * IndicatorCountOutputType without action
   */
  export type IndicatorCountOutputTypeCountActivitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ActivityWhereInput
  }


  /**
   * Count Type ActivityCountOutputType
   */

  export type ActivityCountOutputType = {
    gradeEntries: number
  }

  export type ActivityCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    gradeEntries?: boolean | ActivityCountOutputTypeCountGradeEntriesArgs
  }

  // Custom InputTypes
  /**
   * ActivityCountOutputType without action
   */
  export type ActivityCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityCountOutputType
     */
    select?: ActivityCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ActivityCountOutputType without action
   */
  export type ActivityCountOutputTypeCountGradeEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GradeEntryWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    password: string | null
    name: string | null
    lastName: string | null
    role: $Enums.Role | null
    avatar: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    password: string | null
    name: string | null
    lastName: string | null
    role: $Enums.Role | null
    avatar: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    password: number
    name: number
    lastName: number
    role: number
    avatar: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    password?: true
    name?: true
    lastName?: true
    role?: true
    avatar?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    password?: true
    name?: true
    lastName?: true
    role?: true
    avatar?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    password?: true
    name?: true
    lastName?: true
    role?: true
    avatar?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    password: string
    name: string
    lastName: string
    role: $Enums.Role
    avatar: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    name?: boolean
    lastName?: boolean
    role?: boolean
    avatar?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    teacherCourses?: boolean | User$teacherCoursesArgs<ExtArgs>
    enrollments?: boolean | User$enrollmentsArgs<ExtArgs>
    gradebookEntries?: boolean | User$gradebookEntriesArgs<ExtArgs>
    selfEvaluations?: boolean | User$selfEvaluationsArgs<ExtArgs>
    peerEvaluationsGiven?: boolean | User$peerEvaluationsGivenArgs<ExtArgs>
    peerEvaluationsReceived?: boolean | User$peerEvaluationsReceivedArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    name?: boolean
    lastName?: boolean
    role?: boolean
    avatar?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    name?: boolean
    lastName?: boolean
    role?: boolean
    avatar?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    password?: boolean
    name?: boolean
    lastName?: boolean
    role?: boolean
    avatar?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "password" | "name" | "lastName" | "role" | "avatar" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    teacherCourses?: boolean | User$teacherCoursesArgs<ExtArgs>
    enrollments?: boolean | User$enrollmentsArgs<ExtArgs>
    gradebookEntries?: boolean | User$gradebookEntriesArgs<ExtArgs>
    selfEvaluations?: boolean | User$selfEvaluationsArgs<ExtArgs>
    peerEvaluationsGiven?: boolean | User$peerEvaluationsGivenArgs<ExtArgs>
    peerEvaluationsReceived?: boolean | User$peerEvaluationsReceivedArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      teacherCourses: Prisma.$CoursePayload<ExtArgs>[]
      enrollments: Prisma.$EnrollmentPayload<ExtArgs>[]
      gradebookEntries: Prisma.$GradeEntryPayload<ExtArgs>[]
      selfEvaluations: Prisma.$SelfEvaluationPayload<ExtArgs>[]
      peerEvaluationsGiven: Prisma.$PeerEvaluationPayload<ExtArgs>[]
      peerEvaluationsReceived: Prisma.$PeerEvaluationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      password: string
      name: string
      lastName: string
      role: $Enums.Role
      avatar: string | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    teacherCourses<T extends User$teacherCoursesArgs<ExtArgs> = {}>(args?: Subset<T, User$teacherCoursesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    enrollments<T extends User$enrollmentsArgs<ExtArgs> = {}>(args?: Subset<T, User$enrollmentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    gradebookEntries<T extends User$gradebookEntriesArgs<ExtArgs> = {}>(args?: Subset<T, User$gradebookEntriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    selfEvaluations<T extends User$selfEvaluationsArgs<ExtArgs> = {}>(args?: Subset<T, User$selfEvaluationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    peerEvaluationsGiven<T extends User$peerEvaluationsGivenArgs<ExtArgs> = {}>(args?: Subset<T, User$peerEvaluationsGivenArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    peerEvaluationsReceived<T extends User$peerEvaluationsReceivedArgs<ExtArgs> = {}>(args?: Subset<T, User$peerEvaluationsReceivedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly lastName: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'Role'>
    readonly avatar: FieldRef<"User", 'String'>
    readonly isActive: FieldRef<"User", 'Boolean'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.teacherCourses
   */
  export type User$teacherCoursesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    where?: CourseWhereInput
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    cursor?: CourseWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CourseScalarFieldEnum | CourseScalarFieldEnum[]
  }

  /**
   * User.enrollments
   */
  export type User$enrollmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    where?: EnrollmentWhereInput
    orderBy?: EnrollmentOrderByWithRelationInput | EnrollmentOrderByWithRelationInput[]
    cursor?: EnrollmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EnrollmentScalarFieldEnum | EnrollmentScalarFieldEnum[]
  }

  /**
   * User.gradebookEntries
   */
  export type User$gradebookEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    where?: GradeEntryWhereInput
    orderBy?: GradeEntryOrderByWithRelationInput | GradeEntryOrderByWithRelationInput[]
    cursor?: GradeEntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GradeEntryScalarFieldEnum | GradeEntryScalarFieldEnum[]
  }

  /**
   * User.selfEvaluations
   */
  export type User$selfEvaluationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
    where?: SelfEvaluationWhereInput
    orderBy?: SelfEvaluationOrderByWithRelationInput | SelfEvaluationOrderByWithRelationInput[]
    cursor?: SelfEvaluationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SelfEvaluationScalarFieldEnum | SelfEvaluationScalarFieldEnum[]
  }

  /**
   * User.peerEvaluationsGiven
   */
  export type User$peerEvaluationsGivenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    where?: PeerEvaluationWhereInput
    orderBy?: PeerEvaluationOrderByWithRelationInput | PeerEvaluationOrderByWithRelationInput[]
    cursor?: PeerEvaluationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PeerEvaluationScalarFieldEnum | PeerEvaluationScalarFieldEnum[]
  }

  /**
   * User.peerEvaluationsReceived
   */
  export type User$peerEvaluationsReceivedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    where?: PeerEvaluationWhereInput
    orderBy?: PeerEvaluationOrderByWithRelationInput | PeerEvaluationOrderByWithRelationInput[]
    cursor?: PeerEvaluationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PeerEvaluationScalarFieldEnum | PeerEvaluationScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Course
   */

  export type AggregateCourse = {
    _count: CourseCountAggregateOutputType | null
    _min: CourseMinAggregateOutputType | null
    _max: CourseMaxAggregateOutputType | null
  }

  export type CourseMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    code: string | null
    isActive: boolean | null
    teacherId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    code: string | null
    isActive: boolean | null
    teacherId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseCountAggregateOutputType = {
    id: number
    name: number
    description: number
    code: number
    isActive: number
    teacherId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CourseMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    code?: true
    isActive?: true
    teacherId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    code?: true
    isActive?: true
    teacherId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    code?: true
    isActive?: true
    teacherId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CourseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Course to aggregate.
     */
    where?: CourseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Courses to fetch.
     */
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CourseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Courses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Courses
    **/
    _count?: true | CourseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CourseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CourseMaxAggregateInputType
  }

  export type GetCourseAggregateType<T extends CourseAggregateArgs> = {
        [P in keyof T & keyof AggregateCourse]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCourse[P]>
      : GetScalarType<T[P], AggregateCourse[P]>
  }




  export type CourseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseWhereInput
    orderBy?: CourseOrderByWithAggregationInput | CourseOrderByWithAggregationInput[]
    by: CourseScalarFieldEnum[] | CourseScalarFieldEnum
    having?: CourseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CourseCountAggregateInputType | true
    _min?: CourseMinAggregateInputType
    _max?: CourseMaxAggregateInputType
  }

  export type CourseGroupByOutputType = {
    id: string
    name: string
    description: string | null
    code: string
    isActive: boolean
    teacherId: string
    createdAt: Date
    updatedAt: Date
    _count: CourseCountAggregateOutputType | null
    _min: CourseMinAggregateOutputType | null
    _max: CourseMaxAggregateOutputType | null
  }

  type GetCourseGroupByPayload<T extends CourseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CourseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CourseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CourseGroupByOutputType[P]>
            : GetScalarType<T[P], CourseGroupByOutputType[P]>
        }
      >
    >


  export type CourseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    code?: boolean
    isActive?: boolean
    teacherId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    teacher?: boolean | UserDefaultArgs<ExtArgs>
    enrollments?: boolean | Course$enrollmentsArgs<ExtArgs>
    classes?: boolean | Course$classesArgs<ExtArgs>
    gradebookStructure?: boolean | Course$gradebookStructureArgs<ExtArgs>
    periods?: boolean | Course$periodsArgs<ExtArgs>
    _count?: boolean | CourseCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["course"]>

  export type CourseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    code?: boolean
    isActive?: boolean
    teacherId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    teacher?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["course"]>

  export type CourseSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    code?: boolean
    isActive?: boolean
    teacherId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    teacher?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["course"]>

  export type CourseSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    code?: boolean
    isActive?: boolean
    teacherId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CourseOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "description" | "code" | "isActive" | "teacherId" | "createdAt" | "updatedAt", ExtArgs["result"]["course"]>
  export type CourseInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    teacher?: boolean | UserDefaultArgs<ExtArgs>
    enrollments?: boolean | Course$enrollmentsArgs<ExtArgs>
    classes?: boolean | Course$classesArgs<ExtArgs>
    gradebookStructure?: boolean | Course$gradebookStructureArgs<ExtArgs>
    periods?: boolean | Course$periodsArgs<ExtArgs>
    _count?: boolean | CourseCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CourseIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    teacher?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CourseIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    teacher?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CoursePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Course"
    objects: {
      teacher: Prisma.$UserPayload<ExtArgs>
      enrollments: Prisma.$EnrollmentPayload<ExtArgs>[]
      classes: Prisma.$ClassPayload<ExtArgs>[]
      gradebookStructure: Prisma.$GradebookStructurePayload<ExtArgs> | null
      periods: Prisma.$PeriodPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string | null
      code: string
      isActive: boolean
      teacherId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["course"]>
    composites: {}
  }

  type CourseGetPayload<S extends boolean | null | undefined | CourseDefaultArgs> = $Result.GetResult<Prisma.$CoursePayload, S>

  type CourseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CourseFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CourseCountAggregateInputType | true
    }

  export interface CourseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Course'], meta: { name: 'Course' } }
    /**
     * Find zero or one Course that matches the filter.
     * @param {CourseFindUniqueArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CourseFindUniqueArgs>(args: SelectSubset<T, CourseFindUniqueArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Course that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CourseFindUniqueOrThrowArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CourseFindUniqueOrThrowArgs>(args: SelectSubset<T, CourseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Course that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFindFirstArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CourseFindFirstArgs>(args?: SelectSubset<T, CourseFindFirstArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Course that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFindFirstOrThrowArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CourseFindFirstOrThrowArgs>(args?: SelectSubset<T, CourseFindFirstOrThrowArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Courses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Courses
     * const courses = await prisma.course.findMany()
     * 
     * // Get first 10 Courses
     * const courses = await prisma.course.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const courseWithIdOnly = await prisma.course.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CourseFindManyArgs>(args?: SelectSubset<T, CourseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Course.
     * @param {CourseCreateArgs} args - Arguments to create a Course.
     * @example
     * // Create one Course
     * const Course = await prisma.course.create({
     *   data: {
     *     // ... data to create a Course
     *   }
     * })
     * 
     */
    create<T extends CourseCreateArgs>(args: SelectSubset<T, CourseCreateArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Courses.
     * @param {CourseCreateManyArgs} args - Arguments to create many Courses.
     * @example
     * // Create many Courses
     * const course = await prisma.course.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CourseCreateManyArgs>(args?: SelectSubset<T, CourseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Courses and returns the data saved in the database.
     * @param {CourseCreateManyAndReturnArgs} args - Arguments to create many Courses.
     * @example
     * // Create many Courses
     * const course = await prisma.course.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Courses and only return the `id`
     * const courseWithIdOnly = await prisma.course.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CourseCreateManyAndReturnArgs>(args?: SelectSubset<T, CourseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Course.
     * @param {CourseDeleteArgs} args - Arguments to delete one Course.
     * @example
     * // Delete one Course
     * const Course = await prisma.course.delete({
     *   where: {
     *     // ... filter to delete one Course
     *   }
     * })
     * 
     */
    delete<T extends CourseDeleteArgs>(args: SelectSubset<T, CourseDeleteArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Course.
     * @param {CourseUpdateArgs} args - Arguments to update one Course.
     * @example
     * // Update one Course
     * const course = await prisma.course.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CourseUpdateArgs>(args: SelectSubset<T, CourseUpdateArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Courses.
     * @param {CourseDeleteManyArgs} args - Arguments to filter Courses to delete.
     * @example
     * // Delete a few Courses
     * const { count } = await prisma.course.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CourseDeleteManyArgs>(args?: SelectSubset<T, CourseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Courses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Courses
     * const course = await prisma.course.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CourseUpdateManyArgs>(args: SelectSubset<T, CourseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Courses and returns the data updated in the database.
     * @param {CourseUpdateManyAndReturnArgs} args - Arguments to update many Courses.
     * @example
     * // Update many Courses
     * const course = await prisma.course.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Courses and only return the `id`
     * const courseWithIdOnly = await prisma.course.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CourseUpdateManyAndReturnArgs>(args: SelectSubset<T, CourseUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Course.
     * @param {CourseUpsertArgs} args - Arguments to update or create a Course.
     * @example
     * // Update or create a Course
     * const course = await prisma.course.upsert({
     *   create: {
     *     // ... data to create a Course
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Course we want to update
     *   }
     * })
     */
    upsert<T extends CourseUpsertArgs>(args: SelectSubset<T, CourseUpsertArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Courses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseCountArgs} args - Arguments to filter Courses to count.
     * @example
     * // Count the number of Courses
     * const count = await prisma.course.count({
     *   where: {
     *     // ... the filter for the Courses we want to count
     *   }
     * })
    **/
    count<T extends CourseCountArgs>(
      args?: Subset<T, CourseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CourseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Course.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CourseAggregateArgs>(args: Subset<T, CourseAggregateArgs>): Prisma.PrismaPromise<GetCourseAggregateType<T>>

    /**
     * Group by Course.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CourseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CourseGroupByArgs['orderBy'] }
        : { orderBy?: CourseGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CourseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCourseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Course model
   */
  readonly fields: CourseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Course.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CourseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    teacher<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    enrollments<T extends Course$enrollmentsArgs<ExtArgs> = {}>(args?: Subset<T, Course$enrollmentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    classes<T extends Course$classesArgs<ExtArgs> = {}>(args?: Subset<T, Course$classesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    gradebookStructure<T extends Course$gradebookStructureArgs<ExtArgs> = {}>(args?: Subset<T, Course$gradebookStructureArgs<ExtArgs>>): Prisma__GradebookStructureClient<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    periods<T extends Course$periodsArgs<ExtArgs> = {}>(args?: Subset<T, Course$periodsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Course model
   */
  interface CourseFieldRefs {
    readonly id: FieldRef<"Course", 'String'>
    readonly name: FieldRef<"Course", 'String'>
    readonly description: FieldRef<"Course", 'String'>
    readonly code: FieldRef<"Course", 'String'>
    readonly isActive: FieldRef<"Course", 'Boolean'>
    readonly teacherId: FieldRef<"Course", 'String'>
    readonly createdAt: FieldRef<"Course", 'DateTime'>
    readonly updatedAt: FieldRef<"Course", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Course findUnique
   */
  export type CourseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter, which Course to fetch.
     */
    where: CourseWhereUniqueInput
  }

  /**
   * Course findUniqueOrThrow
   */
  export type CourseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter, which Course to fetch.
     */
    where: CourseWhereUniqueInput
  }

  /**
   * Course findFirst
   */
  export type CourseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter, which Course to fetch.
     */
    where?: CourseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Courses to fetch.
     */
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Courses.
     */
    cursor?: CourseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Courses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Courses.
     */
    distinct?: CourseScalarFieldEnum | CourseScalarFieldEnum[]
  }

  /**
   * Course findFirstOrThrow
   */
  export type CourseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter, which Course to fetch.
     */
    where?: CourseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Courses to fetch.
     */
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Courses.
     */
    cursor?: CourseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Courses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Courses.
     */
    distinct?: CourseScalarFieldEnum | CourseScalarFieldEnum[]
  }

  /**
   * Course findMany
   */
  export type CourseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter, which Courses to fetch.
     */
    where?: CourseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Courses to fetch.
     */
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Courses.
     */
    cursor?: CourseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Courses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Courses.
     */
    distinct?: CourseScalarFieldEnum | CourseScalarFieldEnum[]
  }

  /**
   * Course create
   */
  export type CourseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * The data needed to create a Course.
     */
    data: XOR<CourseCreateInput, CourseUncheckedCreateInput>
  }

  /**
   * Course createMany
   */
  export type CourseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Courses.
     */
    data: CourseCreateManyInput | CourseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Course createManyAndReturn
   */
  export type CourseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * The data used to create many Courses.
     */
    data: CourseCreateManyInput | CourseCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Course update
   */
  export type CourseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * The data needed to update a Course.
     */
    data: XOR<CourseUpdateInput, CourseUncheckedUpdateInput>
    /**
     * Choose, which Course to update.
     */
    where: CourseWhereUniqueInput
  }

  /**
   * Course updateMany
   */
  export type CourseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Courses.
     */
    data: XOR<CourseUpdateManyMutationInput, CourseUncheckedUpdateManyInput>
    /**
     * Filter which Courses to update
     */
    where?: CourseWhereInput
    /**
     * Limit how many Courses to update.
     */
    limit?: number
  }

  /**
   * Course updateManyAndReturn
   */
  export type CourseUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * The data used to update Courses.
     */
    data: XOR<CourseUpdateManyMutationInput, CourseUncheckedUpdateManyInput>
    /**
     * Filter which Courses to update
     */
    where?: CourseWhereInput
    /**
     * Limit how many Courses to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Course upsert
   */
  export type CourseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * The filter to search for the Course to update in case it exists.
     */
    where: CourseWhereUniqueInput
    /**
     * In case the Course found by the `where` argument doesn't exist, create a new Course with this data.
     */
    create: XOR<CourseCreateInput, CourseUncheckedCreateInput>
    /**
     * In case the Course was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CourseUpdateInput, CourseUncheckedUpdateInput>
  }

  /**
   * Course delete
   */
  export type CourseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter which Course to delete.
     */
    where: CourseWhereUniqueInput
  }

  /**
   * Course deleteMany
   */
  export type CourseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Courses to delete
     */
    where?: CourseWhereInput
    /**
     * Limit how many Courses to delete.
     */
    limit?: number
  }

  /**
   * Course.enrollments
   */
  export type Course$enrollmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    where?: EnrollmentWhereInput
    orderBy?: EnrollmentOrderByWithRelationInput | EnrollmentOrderByWithRelationInput[]
    cursor?: EnrollmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EnrollmentScalarFieldEnum | EnrollmentScalarFieldEnum[]
  }

  /**
   * Course.classes
   */
  export type Course$classesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
    where?: ClassWhereInput
    orderBy?: ClassOrderByWithRelationInput | ClassOrderByWithRelationInput[]
    cursor?: ClassWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ClassScalarFieldEnum | ClassScalarFieldEnum[]
  }

  /**
   * Course.gradebookStructure
   */
  export type Course$gradebookStructureArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
    where?: GradebookStructureWhereInput
  }

  /**
   * Course.periods
   */
  export type Course$periodsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
    where?: PeriodWhereInput
    orderBy?: PeriodOrderByWithRelationInput | PeriodOrderByWithRelationInput[]
    cursor?: PeriodWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PeriodScalarFieldEnum | PeriodScalarFieldEnum[]
  }

  /**
   * Course without action
   */
  export type CourseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
  }


  /**
   * Model Period
   */

  export type AggregatePeriod = {
    _count: PeriodCountAggregateOutputType | null
    _min: PeriodMinAggregateOutputType | null
    _max: PeriodMaxAggregateOutputType | null
  }

  export type PeriodMinAggregateOutputType = {
    id: string | null
    name: string | null
    startDate: Date | null
    endDate: Date | null
    isActive: boolean | null
    courseId: string | null
    createdAt: Date | null
  }

  export type PeriodMaxAggregateOutputType = {
    id: string | null
    name: string | null
    startDate: Date | null
    endDate: Date | null
    isActive: boolean | null
    courseId: string | null
    createdAt: Date | null
  }

  export type PeriodCountAggregateOutputType = {
    id: number
    name: number
    startDate: number
    endDate: number
    isActive: number
    courseId: number
    createdAt: number
    _all: number
  }


  export type PeriodMinAggregateInputType = {
    id?: true
    name?: true
    startDate?: true
    endDate?: true
    isActive?: true
    courseId?: true
    createdAt?: true
  }

  export type PeriodMaxAggregateInputType = {
    id?: true
    name?: true
    startDate?: true
    endDate?: true
    isActive?: true
    courseId?: true
    createdAt?: true
  }

  export type PeriodCountAggregateInputType = {
    id?: true
    name?: true
    startDate?: true
    endDate?: true
    isActive?: true
    courseId?: true
    createdAt?: true
    _all?: true
  }

  export type PeriodAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Period to aggregate.
     */
    where?: PeriodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Periods to fetch.
     */
    orderBy?: PeriodOrderByWithRelationInput | PeriodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PeriodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Periods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Periods.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Periods
    **/
    _count?: true | PeriodCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PeriodMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PeriodMaxAggregateInputType
  }

  export type GetPeriodAggregateType<T extends PeriodAggregateArgs> = {
        [P in keyof T & keyof AggregatePeriod]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePeriod[P]>
      : GetScalarType<T[P], AggregatePeriod[P]>
  }




  export type PeriodGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PeriodWhereInput
    orderBy?: PeriodOrderByWithAggregationInput | PeriodOrderByWithAggregationInput[]
    by: PeriodScalarFieldEnum[] | PeriodScalarFieldEnum
    having?: PeriodScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PeriodCountAggregateInputType | true
    _min?: PeriodMinAggregateInputType
    _max?: PeriodMaxAggregateInputType
  }

  export type PeriodGroupByOutputType = {
    id: string
    name: string
    startDate: Date
    endDate: Date
    isActive: boolean
    courseId: string
    createdAt: Date
    _count: PeriodCountAggregateOutputType | null
    _min: PeriodMinAggregateOutputType | null
    _max: PeriodMaxAggregateOutputType | null
  }

  type GetPeriodGroupByPayload<T extends PeriodGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PeriodGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PeriodGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PeriodGroupByOutputType[P]>
            : GetScalarType<T[P], PeriodGroupByOutputType[P]>
        }
      >
    >


  export type PeriodSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    startDate?: boolean
    endDate?: boolean
    isActive?: boolean
    courseId?: boolean
    createdAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
    gradeEntries?: boolean | Period$gradeEntriesArgs<ExtArgs>
    _count?: boolean | PeriodCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["period"]>

  export type PeriodSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    startDate?: boolean
    endDate?: boolean
    isActive?: boolean
    courseId?: boolean
    createdAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["period"]>

  export type PeriodSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    startDate?: boolean
    endDate?: boolean
    isActive?: boolean
    courseId?: boolean
    createdAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["period"]>

  export type PeriodSelectScalar = {
    id?: boolean
    name?: boolean
    startDate?: boolean
    endDate?: boolean
    isActive?: boolean
    courseId?: boolean
    createdAt?: boolean
  }

  export type PeriodOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "startDate" | "endDate" | "isActive" | "courseId" | "createdAt", ExtArgs["result"]["period"]>
  export type PeriodInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
    gradeEntries?: boolean | Period$gradeEntriesArgs<ExtArgs>
    _count?: boolean | PeriodCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PeriodIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }
  export type PeriodIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }

  export type $PeriodPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Period"
    objects: {
      course: Prisma.$CoursePayload<ExtArgs>
      gradeEntries: Prisma.$GradeEntryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      startDate: Date
      endDate: Date
      isActive: boolean
      courseId: string
      createdAt: Date
    }, ExtArgs["result"]["period"]>
    composites: {}
  }

  type PeriodGetPayload<S extends boolean | null | undefined | PeriodDefaultArgs> = $Result.GetResult<Prisma.$PeriodPayload, S>

  type PeriodCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PeriodFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PeriodCountAggregateInputType | true
    }

  export interface PeriodDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Period'], meta: { name: 'Period' } }
    /**
     * Find zero or one Period that matches the filter.
     * @param {PeriodFindUniqueArgs} args - Arguments to find a Period
     * @example
     * // Get one Period
     * const period = await prisma.period.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PeriodFindUniqueArgs>(args: SelectSubset<T, PeriodFindUniqueArgs<ExtArgs>>): Prisma__PeriodClient<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Period that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PeriodFindUniqueOrThrowArgs} args - Arguments to find a Period
     * @example
     * // Get one Period
     * const period = await prisma.period.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PeriodFindUniqueOrThrowArgs>(args: SelectSubset<T, PeriodFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PeriodClient<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Period that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeriodFindFirstArgs} args - Arguments to find a Period
     * @example
     * // Get one Period
     * const period = await prisma.period.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PeriodFindFirstArgs>(args?: SelectSubset<T, PeriodFindFirstArgs<ExtArgs>>): Prisma__PeriodClient<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Period that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeriodFindFirstOrThrowArgs} args - Arguments to find a Period
     * @example
     * // Get one Period
     * const period = await prisma.period.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PeriodFindFirstOrThrowArgs>(args?: SelectSubset<T, PeriodFindFirstOrThrowArgs<ExtArgs>>): Prisma__PeriodClient<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Periods that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeriodFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Periods
     * const periods = await prisma.period.findMany()
     * 
     * // Get first 10 Periods
     * const periods = await prisma.period.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const periodWithIdOnly = await prisma.period.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PeriodFindManyArgs>(args?: SelectSubset<T, PeriodFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Period.
     * @param {PeriodCreateArgs} args - Arguments to create a Period.
     * @example
     * // Create one Period
     * const Period = await prisma.period.create({
     *   data: {
     *     // ... data to create a Period
     *   }
     * })
     * 
     */
    create<T extends PeriodCreateArgs>(args: SelectSubset<T, PeriodCreateArgs<ExtArgs>>): Prisma__PeriodClient<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Periods.
     * @param {PeriodCreateManyArgs} args - Arguments to create many Periods.
     * @example
     * // Create many Periods
     * const period = await prisma.period.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PeriodCreateManyArgs>(args?: SelectSubset<T, PeriodCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Periods and returns the data saved in the database.
     * @param {PeriodCreateManyAndReturnArgs} args - Arguments to create many Periods.
     * @example
     * // Create many Periods
     * const period = await prisma.period.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Periods and only return the `id`
     * const periodWithIdOnly = await prisma.period.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PeriodCreateManyAndReturnArgs>(args?: SelectSubset<T, PeriodCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Period.
     * @param {PeriodDeleteArgs} args - Arguments to delete one Period.
     * @example
     * // Delete one Period
     * const Period = await prisma.period.delete({
     *   where: {
     *     // ... filter to delete one Period
     *   }
     * })
     * 
     */
    delete<T extends PeriodDeleteArgs>(args: SelectSubset<T, PeriodDeleteArgs<ExtArgs>>): Prisma__PeriodClient<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Period.
     * @param {PeriodUpdateArgs} args - Arguments to update one Period.
     * @example
     * // Update one Period
     * const period = await prisma.period.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PeriodUpdateArgs>(args: SelectSubset<T, PeriodUpdateArgs<ExtArgs>>): Prisma__PeriodClient<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Periods.
     * @param {PeriodDeleteManyArgs} args - Arguments to filter Periods to delete.
     * @example
     * // Delete a few Periods
     * const { count } = await prisma.period.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PeriodDeleteManyArgs>(args?: SelectSubset<T, PeriodDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Periods.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeriodUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Periods
     * const period = await prisma.period.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PeriodUpdateManyArgs>(args: SelectSubset<T, PeriodUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Periods and returns the data updated in the database.
     * @param {PeriodUpdateManyAndReturnArgs} args - Arguments to update many Periods.
     * @example
     * // Update many Periods
     * const period = await prisma.period.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Periods and only return the `id`
     * const periodWithIdOnly = await prisma.period.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PeriodUpdateManyAndReturnArgs>(args: SelectSubset<T, PeriodUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Period.
     * @param {PeriodUpsertArgs} args - Arguments to update or create a Period.
     * @example
     * // Update or create a Period
     * const period = await prisma.period.upsert({
     *   create: {
     *     // ... data to create a Period
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Period we want to update
     *   }
     * })
     */
    upsert<T extends PeriodUpsertArgs>(args: SelectSubset<T, PeriodUpsertArgs<ExtArgs>>): Prisma__PeriodClient<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Periods.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeriodCountArgs} args - Arguments to filter Periods to count.
     * @example
     * // Count the number of Periods
     * const count = await prisma.period.count({
     *   where: {
     *     // ... the filter for the Periods we want to count
     *   }
     * })
    **/
    count<T extends PeriodCountArgs>(
      args?: Subset<T, PeriodCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PeriodCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Period.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeriodAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PeriodAggregateArgs>(args: Subset<T, PeriodAggregateArgs>): Prisma.PrismaPromise<GetPeriodAggregateType<T>>

    /**
     * Group by Period.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeriodGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PeriodGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PeriodGroupByArgs['orderBy'] }
        : { orderBy?: PeriodGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PeriodGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPeriodGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Period model
   */
  readonly fields: PeriodFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Period.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PeriodClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    course<T extends CourseDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CourseDefaultArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    gradeEntries<T extends Period$gradeEntriesArgs<ExtArgs> = {}>(args?: Subset<T, Period$gradeEntriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Period model
   */
  interface PeriodFieldRefs {
    readonly id: FieldRef<"Period", 'String'>
    readonly name: FieldRef<"Period", 'String'>
    readonly startDate: FieldRef<"Period", 'DateTime'>
    readonly endDate: FieldRef<"Period", 'DateTime'>
    readonly isActive: FieldRef<"Period", 'Boolean'>
    readonly courseId: FieldRef<"Period", 'String'>
    readonly createdAt: FieldRef<"Period", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Period findUnique
   */
  export type PeriodFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
    /**
     * Filter, which Period to fetch.
     */
    where: PeriodWhereUniqueInput
  }

  /**
   * Period findUniqueOrThrow
   */
  export type PeriodFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
    /**
     * Filter, which Period to fetch.
     */
    where: PeriodWhereUniqueInput
  }

  /**
   * Period findFirst
   */
  export type PeriodFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
    /**
     * Filter, which Period to fetch.
     */
    where?: PeriodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Periods to fetch.
     */
    orderBy?: PeriodOrderByWithRelationInput | PeriodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Periods.
     */
    cursor?: PeriodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Periods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Periods.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Periods.
     */
    distinct?: PeriodScalarFieldEnum | PeriodScalarFieldEnum[]
  }

  /**
   * Period findFirstOrThrow
   */
  export type PeriodFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
    /**
     * Filter, which Period to fetch.
     */
    where?: PeriodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Periods to fetch.
     */
    orderBy?: PeriodOrderByWithRelationInput | PeriodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Periods.
     */
    cursor?: PeriodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Periods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Periods.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Periods.
     */
    distinct?: PeriodScalarFieldEnum | PeriodScalarFieldEnum[]
  }

  /**
   * Period findMany
   */
  export type PeriodFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
    /**
     * Filter, which Periods to fetch.
     */
    where?: PeriodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Periods to fetch.
     */
    orderBy?: PeriodOrderByWithRelationInput | PeriodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Periods.
     */
    cursor?: PeriodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Periods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Periods.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Periods.
     */
    distinct?: PeriodScalarFieldEnum | PeriodScalarFieldEnum[]
  }

  /**
   * Period create
   */
  export type PeriodCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
    /**
     * The data needed to create a Period.
     */
    data: XOR<PeriodCreateInput, PeriodUncheckedCreateInput>
  }

  /**
   * Period createMany
   */
  export type PeriodCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Periods.
     */
    data: PeriodCreateManyInput | PeriodCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Period createManyAndReturn
   */
  export type PeriodCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * The data used to create many Periods.
     */
    data: PeriodCreateManyInput | PeriodCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Period update
   */
  export type PeriodUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
    /**
     * The data needed to update a Period.
     */
    data: XOR<PeriodUpdateInput, PeriodUncheckedUpdateInput>
    /**
     * Choose, which Period to update.
     */
    where: PeriodWhereUniqueInput
  }

  /**
   * Period updateMany
   */
  export type PeriodUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Periods.
     */
    data: XOR<PeriodUpdateManyMutationInput, PeriodUncheckedUpdateManyInput>
    /**
     * Filter which Periods to update
     */
    where?: PeriodWhereInput
    /**
     * Limit how many Periods to update.
     */
    limit?: number
  }

  /**
   * Period updateManyAndReturn
   */
  export type PeriodUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * The data used to update Periods.
     */
    data: XOR<PeriodUpdateManyMutationInput, PeriodUncheckedUpdateManyInput>
    /**
     * Filter which Periods to update
     */
    where?: PeriodWhereInput
    /**
     * Limit how many Periods to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Period upsert
   */
  export type PeriodUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
    /**
     * The filter to search for the Period to update in case it exists.
     */
    where: PeriodWhereUniqueInput
    /**
     * In case the Period found by the `where` argument doesn't exist, create a new Period with this data.
     */
    create: XOR<PeriodCreateInput, PeriodUncheckedCreateInput>
    /**
     * In case the Period was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PeriodUpdateInput, PeriodUncheckedUpdateInput>
  }

  /**
   * Period delete
   */
  export type PeriodDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
    /**
     * Filter which Period to delete.
     */
    where: PeriodWhereUniqueInput
  }

  /**
   * Period deleteMany
   */
  export type PeriodDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Periods to delete
     */
    where?: PeriodWhereInput
    /**
     * Limit how many Periods to delete.
     */
    limit?: number
  }

  /**
   * Period.gradeEntries
   */
  export type Period$gradeEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    where?: GradeEntryWhereInput
    orderBy?: GradeEntryOrderByWithRelationInput | GradeEntryOrderByWithRelationInput[]
    cursor?: GradeEntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GradeEntryScalarFieldEnum | GradeEntryScalarFieldEnum[]
  }

  /**
   * Period without action
   */
  export type PeriodDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Period
     */
    select?: PeriodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Period
     */
    omit?: PeriodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeriodInclude<ExtArgs> | null
  }


  /**
   * Model Enrollment
   */

  export type AggregateEnrollment = {
    _count: EnrollmentCountAggregateOutputType | null
    _min: EnrollmentMinAggregateOutputType | null
    _max: EnrollmentMaxAggregateOutputType | null
  }

  export type EnrollmentMinAggregateOutputType = {
    id: string | null
    userId: string | null
    courseId: string | null
    createdAt: Date | null
  }

  export type EnrollmentMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    courseId: string | null
    createdAt: Date | null
  }

  export type EnrollmentCountAggregateOutputType = {
    id: number
    userId: number
    courseId: number
    createdAt: number
    _all: number
  }


  export type EnrollmentMinAggregateInputType = {
    id?: true
    userId?: true
    courseId?: true
    createdAt?: true
  }

  export type EnrollmentMaxAggregateInputType = {
    id?: true
    userId?: true
    courseId?: true
    createdAt?: true
  }

  export type EnrollmentCountAggregateInputType = {
    id?: true
    userId?: true
    courseId?: true
    createdAt?: true
    _all?: true
  }

  export type EnrollmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Enrollment to aggregate.
     */
    where?: EnrollmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Enrollments to fetch.
     */
    orderBy?: EnrollmentOrderByWithRelationInput | EnrollmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EnrollmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Enrollments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Enrollments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Enrollments
    **/
    _count?: true | EnrollmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EnrollmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EnrollmentMaxAggregateInputType
  }

  export type GetEnrollmentAggregateType<T extends EnrollmentAggregateArgs> = {
        [P in keyof T & keyof AggregateEnrollment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEnrollment[P]>
      : GetScalarType<T[P], AggregateEnrollment[P]>
  }




  export type EnrollmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EnrollmentWhereInput
    orderBy?: EnrollmentOrderByWithAggregationInput | EnrollmentOrderByWithAggregationInput[]
    by: EnrollmentScalarFieldEnum[] | EnrollmentScalarFieldEnum
    having?: EnrollmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EnrollmentCountAggregateInputType | true
    _min?: EnrollmentMinAggregateInputType
    _max?: EnrollmentMaxAggregateInputType
  }

  export type EnrollmentGroupByOutputType = {
    id: string
    userId: string
    courseId: string
    createdAt: Date
    _count: EnrollmentCountAggregateOutputType | null
    _min: EnrollmentMinAggregateOutputType | null
    _max: EnrollmentMaxAggregateOutputType | null
  }

  type GetEnrollmentGroupByPayload<T extends EnrollmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EnrollmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EnrollmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EnrollmentGroupByOutputType[P]>
            : GetScalarType<T[P], EnrollmentGroupByOutputType[P]>
        }
      >
    >


  export type EnrollmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    courseId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["enrollment"]>

  export type EnrollmentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    courseId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["enrollment"]>

  export type EnrollmentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    courseId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["enrollment"]>

  export type EnrollmentSelectScalar = {
    id?: boolean
    userId?: boolean
    courseId?: boolean
    createdAt?: boolean
  }

  export type EnrollmentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "courseId" | "createdAt", ExtArgs["result"]["enrollment"]>
  export type EnrollmentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }
  export type EnrollmentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }
  export type EnrollmentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }

  export type $EnrollmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Enrollment"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      course: Prisma.$CoursePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      courseId: string
      createdAt: Date
    }, ExtArgs["result"]["enrollment"]>
    composites: {}
  }

  type EnrollmentGetPayload<S extends boolean | null | undefined | EnrollmentDefaultArgs> = $Result.GetResult<Prisma.$EnrollmentPayload, S>

  type EnrollmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EnrollmentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EnrollmentCountAggregateInputType | true
    }

  export interface EnrollmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Enrollment'], meta: { name: 'Enrollment' } }
    /**
     * Find zero or one Enrollment that matches the filter.
     * @param {EnrollmentFindUniqueArgs} args - Arguments to find a Enrollment
     * @example
     * // Get one Enrollment
     * const enrollment = await prisma.enrollment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EnrollmentFindUniqueArgs>(args: SelectSubset<T, EnrollmentFindUniqueArgs<ExtArgs>>): Prisma__EnrollmentClient<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Enrollment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EnrollmentFindUniqueOrThrowArgs} args - Arguments to find a Enrollment
     * @example
     * // Get one Enrollment
     * const enrollment = await prisma.enrollment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EnrollmentFindUniqueOrThrowArgs>(args: SelectSubset<T, EnrollmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EnrollmentClient<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Enrollment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EnrollmentFindFirstArgs} args - Arguments to find a Enrollment
     * @example
     * // Get one Enrollment
     * const enrollment = await prisma.enrollment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EnrollmentFindFirstArgs>(args?: SelectSubset<T, EnrollmentFindFirstArgs<ExtArgs>>): Prisma__EnrollmentClient<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Enrollment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EnrollmentFindFirstOrThrowArgs} args - Arguments to find a Enrollment
     * @example
     * // Get one Enrollment
     * const enrollment = await prisma.enrollment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EnrollmentFindFirstOrThrowArgs>(args?: SelectSubset<T, EnrollmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__EnrollmentClient<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Enrollments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EnrollmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Enrollments
     * const enrollments = await prisma.enrollment.findMany()
     * 
     * // Get first 10 Enrollments
     * const enrollments = await prisma.enrollment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const enrollmentWithIdOnly = await prisma.enrollment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EnrollmentFindManyArgs>(args?: SelectSubset<T, EnrollmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Enrollment.
     * @param {EnrollmentCreateArgs} args - Arguments to create a Enrollment.
     * @example
     * // Create one Enrollment
     * const Enrollment = await prisma.enrollment.create({
     *   data: {
     *     // ... data to create a Enrollment
     *   }
     * })
     * 
     */
    create<T extends EnrollmentCreateArgs>(args: SelectSubset<T, EnrollmentCreateArgs<ExtArgs>>): Prisma__EnrollmentClient<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Enrollments.
     * @param {EnrollmentCreateManyArgs} args - Arguments to create many Enrollments.
     * @example
     * // Create many Enrollments
     * const enrollment = await prisma.enrollment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EnrollmentCreateManyArgs>(args?: SelectSubset<T, EnrollmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Enrollments and returns the data saved in the database.
     * @param {EnrollmentCreateManyAndReturnArgs} args - Arguments to create many Enrollments.
     * @example
     * // Create many Enrollments
     * const enrollment = await prisma.enrollment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Enrollments and only return the `id`
     * const enrollmentWithIdOnly = await prisma.enrollment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EnrollmentCreateManyAndReturnArgs>(args?: SelectSubset<T, EnrollmentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Enrollment.
     * @param {EnrollmentDeleteArgs} args - Arguments to delete one Enrollment.
     * @example
     * // Delete one Enrollment
     * const Enrollment = await prisma.enrollment.delete({
     *   where: {
     *     // ... filter to delete one Enrollment
     *   }
     * })
     * 
     */
    delete<T extends EnrollmentDeleteArgs>(args: SelectSubset<T, EnrollmentDeleteArgs<ExtArgs>>): Prisma__EnrollmentClient<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Enrollment.
     * @param {EnrollmentUpdateArgs} args - Arguments to update one Enrollment.
     * @example
     * // Update one Enrollment
     * const enrollment = await prisma.enrollment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EnrollmentUpdateArgs>(args: SelectSubset<T, EnrollmentUpdateArgs<ExtArgs>>): Prisma__EnrollmentClient<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Enrollments.
     * @param {EnrollmentDeleteManyArgs} args - Arguments to filter Enrollments to delete.
     * @example
     * // Delete a few Enrollments
     * const { count } = await prisma.enrollment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EnrollmentDeleteManyArgs>(args?: SelectSubset<T, EnrollmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Enrollments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EnrollmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Enrollments
     * const enrollment = await prisma.enrollment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EnrollmentUpdateManyArgs>(args: SelectSubset<T, EnrollmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Enrollments and returns the data updated in the database.
     * @param {EnrollmentUpdateManyAndReturnArgs} args - Arguments to update many Enrollments.
     * @example
     * // Update many Enrollments
     * const enrollment = await prisma.enrollment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Enrollments and only return the `id`
     * const enrollmentWithIdOnly = await prisma.enrollment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EnrollmentUpdateManyAndReturnArgs>(args: SelectSubset<T, EnrollmentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Enrollment.
     * @param {EnrollmentUpsertArgs} args - Arguments to update or create a Enrollment.
     * @example
     * // Update or create a Enrollment
     * const enrollment = await prisma.enrollment.upsert({
     *   create: {
     *     // ... data to create a Enrollment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Enrollment we want to update
     *   }
     * })
     */
    upsert<T extends EnrollmentUpsertArgs>(args: SelectSubset<T, EnrollmentUpsertArgs<ExtArgs>>): Prisma__EnrollmentClient<$Result.GetResult<Prisma.$EnrollmentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Enrollments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EnrollmentCountArgs} args - Arguments to filter Enrollments to count.
     * @example
     * // Count the number of Enrollments
     * const count = await prisma.enrollment.count({
     *   where: {
     *     // ... the filter for the Enrollments we want to count
     *   }
     * })
    **/
    count<T extends EnrollmentCountArgs>(
      args?: Subset<T, EnrollmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EnrollmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Enrollment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EnrollmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EnrollmentAggregateArgs>(args: Subset<T, EnrollmentAggregateArgs>): Prisma.PrismaPromise<GetEnrollmentAggregateType<T>>

    /**
     * Group by Enrollment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EnrollmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EnrollmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EnrollmentGroupByArgs['orderBy'] }
        : { orderBy?: EnrollmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EnrollmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEnrollmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Enrollment model
   */
  readonly fields: EnrollmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Enrollment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EnrollmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    course<T extends CourseDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CourseDefaultArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Enrollment model
   */
  interface EnrollmentFieldRefs {
    readonly id: FieldRef<"Enrollment", 'String'>
    readonly userId: FieldRef<"Enrollment", 'String'>
    readonly courseId: FieldRef<"Enrollment", 'String'>
    readonly createdAt: FieldRef<"Enrollment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Enrollment findUnique
   */
  export type EnrollmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    /**
     * Filter, which Enrollment to fetch.
     */
    where: EnrollmentWhereUniqueInput
  }

  /**
   * Enrollment findUniqueOrThrow
   */
  export type EnrollmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    /**
     * Filter, which Enrollment to fetch.
     */
    where: EnrollmentWhereUniqueInput
  }

  /**
   * Enrollment findFirst
   */
  export type EnrollmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    /**
     * Filter, which Enrollment to fetch.
     */
    where?: EnrollmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Enrollments to fetch.
     */
    orderBy?: EnrollmentOrderByWithRelationInput | EnrollmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Enrollments.
     */
    cursor?: EnrollmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Enrollments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Enrollments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Enrollments.
     */
    distinct?: EnrollmentScalarFieldEnum | EnrollmentScalarFieldEnum[]
  }

  /**
   * Enrollment findFirstOrThrow
   */
  export type EnrollmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    /**
     * Filter, which Enrollment to fetch.
     */
    where?: EnrollmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Enrollments to fetch.
     */
    orderBy?: EnrollmentOrderByWithRelationInput | EnrollmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Enrollments.
     */
    cursor?: EnrollmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Enrollments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Enrollments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Enrollments.
     */
    distinct?: EnrollmentScalarFieldEnum | EnrollmentScalarFieldEnum[]
  }

  /**
   * Enrollment findMany
   */
  export type EnrollmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    /**
     * Filter, which Enrollments to fetch.
     */
    where?: EnrollmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Enrollments to fetch.
     */
    orderBy?: EnrollmentOrderByWithRelationInput | EnrollmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Enrollments.
     */
    cursor?: EnrollmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Enrollments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Enrollments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Enrollments.
     */
    distinct?: EnrollmentScalarFieldEnum | EnrollmentScalarFieldEnum[]
  }

  /**
   * Enrollment create
   */
  export type EnrollmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    /**
     * The data needed to create a Enrollment.
     */
    data: XOR<EnrollmentCreateInput, EnrollmentUncheckedCreateInput>
  }

  /**
   * Enrollment createMany
   */
  export type EnrollmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Enrollments.
     */
    data: EnrollmentCreateManyInput | EnrollmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Enrollment createManyAndReturn
   */
  export type EnrollmentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * The data used to create many Enrollments.
     */
    data: EnrollmentCreateManyInput | EnrollmentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Enrollment update
   */
  export type EnrollmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    /**
     * The data needed to update a Enrollment.
     */
    data: XOR<EnrollmentUpdateInput, EnrollmentUncheckedUpdateInput>
    /**
     * Choose, which Enrollment to update.
     */
    where: EnrollmentWhereUniqueInput
  }

  /**
   * Enrollment updateMany
   */
  export type EnrollmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Enrollments.
     */
    data: XOR<EnrollmentUpdateManyMutationInput, EnrollmentUncheckedUpdateManyInput>
    /**
     * Filter which Enrollments to update
     */
    where?: EnrollmentWhereInput
    /**
     * Limit how many Enrollments to update.
     */
    limit?: number
  }

  /**
   * Enrollment updateManyAndReturn
   */
  export type EnrollmentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * The data used to update Enrollments.
     */
    data: XOR<EnrollmentUpdateManyMutationInput, EnrollmentUncheckedUpdateManyInput>
    /**
     * Filter which Enrollments to update
     */
    where?: EnrollmentWhereInput
    /**
     * Limit how many Enrollments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Enrollment upsert
   */
  export type EnrollmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    /**
     * The filter to search for the Enrollment to update in case it exists.
     */
    where: EnrollmentWhereUniqueInput
    /**
     * In case the Enrollment found by the `where` argument doesn't exist, create a new Enrollment with this data.
     */
    create: XOR<EnrollmentCreateInput, EnrollmentUncheckedCreateInput>
    /**
     * In case the Enrollment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EnrollmentUpdateInput, EnrollmentUncheckedUpdateInput>
  }

  /**
   * Enrollment delete
   */
  export type EnrollmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
    /**
     * Filter which Enrollment to delete.
     */
    where: EnrollmentWhereUniqueInput
  }

  /**
   * Enrollment deleteMany
   */
  export type EnrollmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Enrollments to delete
     */
    where?: EnrollmentWhereInput
    /**
     * Limit how many Enrollments to delete.
     */
    limit?: number
  }

  /**
   * Enrollment without action
   */
  export type EnrollmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Enrollment
     */
    select?: EnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Enrollment
     */
    omit?: EnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EnrollmentInclude<ExtArgs> | null
  }


  /**
   * Model Class
   */

  export type AggregateClass = {
    _count: ClassCountAggregateOutputType | null
    _min: ClassMinAggregateOutputType | null
    _max: ClassMaxAggregateOutputType | null
  }

  export type ClassMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    code: string | null
    status: $Enums.ClassStatus | null
    courseId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ClassMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    code: string | null
    status: $Enums.ClassStatus | null
    courseId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ClassCountAggregateOutputType = {
    id: number
    title: number
    description: number
    code: number
    status: number
    courseId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ClassMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    code?: true
    status?: true
    courseId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ClassMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    code?: true
    status?: true
    courseId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ClassCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    code?: true
    status?: true
    courseId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ClassAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Class to aggregate.
     */
    where?: ClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Classes to fetch.
     */
    orderBy?: ClassOrderByWithRelationInput | ClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Classes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Classes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Classes
    **/
    _count?: true | ClassCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ClassMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ClassMaxAggregateInputType
  }

  export type GetClassAggregateType<T extends ClassAggregateArgs> = {
        [P in keyof T & keyof AggregateClass]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateClass[P]>
      : GetScalarType<T[P], AggregateClass[P]>
  }




  export type ClassGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ClassWhereInput
    orderBy?: ClassOrderByWithAggregationInput | ClassOrderByWithAggregationInput[]
    by: ClassScalarFieldEnum[] | ClassScalarFieldEnum
    having?: ClassScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ClassCountAggregateInputType | true
    _min?: ClassMinAggregateInputType
    _max?: ClassMaxAggregateInputType
  }

  export type ClassGroupByOutputType = {
    id: string
    title: string
    description: string | null
    code: string
    status: $Enums.ClassStatus
    courseId: string
    createdAt: Date
    updatedAt: Date
    _count: ClassCountAggregateOutputType | null
    _min: ClassMinAggregateOutputType | null
    _max: ClassMaxAggregateOutputType | null
  }

  type GetClassGroupByPayload<T extends ClassGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ClassGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ClassGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ClassGroupByOutputType[P]>
            : GetScalarType<T[P], ClassGroupByOutputType[P]>
        }
      >
    >


  export type ClassSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    code?: boolean
    status?: boolean
    courseId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
    slides?: boolean | Class$slidesArgs<ExtArgs>
    _count?: boolean | ClassCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["class"]>

  export type ClassSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    code?: boolean
    status?: boolean
    courseId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["class"]>

  export type ClassSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    code?: boolean
    status?: boolean
    courseId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["class"]>

  export type ClassSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    code?: boolean
    status?: boolean
    courseId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ClassOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "description" | "code" | "status" | "courseId" | "createdAt" | "updatedAt", ExtArgs["result"]["class"]>
  export type ClassInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
    slides?: boolean | Class$slidesArgs<ExtArgs>
    _count?: boolean | ClassCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ClassIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }
  export type ClassIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }

  export type $ClassPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Class"
    objects: {
      course: Prisma.$CoursePayload<ExtArgs>
      slides: Prisma.$SlidePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      description: string | null
      code: string
      status: $Enums.ClassStatus
      courseId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["class"]>
    composites: {}
  }

  type ClassGetPayload<S extends boolean | null | undefined | ClassDefaultArgs> = $Result.GetResult<Prisma.$ClassPayload, S>

  type ClassCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ClassFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ClassCountAggregateInputType | true
    }

  export interface ClassDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Class'], meta: { name: 'Class' } }
    /**
     * Find zero or one Class that matches the filter.
     * @param {ClassFindUniqueArgs} args - Arguments to find a Class
     * @example
     * // Get one Class
     * const class = await prisma.class.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ClassFindUniqueArgs>(args: SelectSubset<T, ClassFindUniqueArgs<ExtArgs>>): Prisma__ClassClient<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Class that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ClassFindUniqueOrThrowArgs} args - Arguments to find a Class
     * @example
     * // Get one Class
     * const class = await prisma.class.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ClassFindUniqueOrThrowArgs>(args: SelectSubset<T, ClassFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ClassClient<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Class that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClassFindFirstArgs} args - Arguments to find a Class
     * @example
     * // Get one Class
     * const class = await prisma.class.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ClassFindFirstArgs>(args?: SelectSubset<T, ClassFindFirstArgs<ExtArgs>>): Prisma__ClassClient<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Class that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClassFindFirstOrThrowArgs} args - Arguments to find a Class
     * @example
     * // Get one Class
     * const class = await prisma.class.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ClassFindFirstOrThrowArgs>(args?: SelectSubset<T, ClassFindFirstOrThrowArgs<ExtArgs>>): Prisma__ClassClient<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Classes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClassFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Classes
     * const classes = await prisma.class.findMany()
     * 
     * // Get first 10 Classes
     * const classes = await prisma.class.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const classWithIdOnly = await prisma.class.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ClassFindManyArgs>(args?: SelectSubset<T, ClassFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Class.
     * @param {ClassCreateArgs} args - Arguments to create a Class.
     * @example
     * // Create one Class
     * const Class = await prisma.class.create({
     *   data: {
     *     // ... data to create a Class
     *   }
     * })
     * 
     */
    create<T extends ClassCreateArgs>(args: SelectSubset<T, ClassCreateArgs<ExtArgs>>): Prisma__ClassClient<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Classes.
     * @param {ClassCreateManyArgs} args - Arguments to create many Classes.
     * @example
     * // Create many Classes
     * const class = await prisma.class.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ClassCreateManyArgs>(args?: SelectSubset<T, ClassCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Classes and returns the data saved in the database.
     * @param {ClassCreateManyAndReturnArgs} args - Arguments to create many Classes.
     * @example
     * // Create many Classes
     * const class = await prisma.class.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Classes and only return the `id`
     * const classWithIdOnly = await prisma.class.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ClassCreateManyAndReturnArgs>(args?: SelectSubset<T, ClassCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Class.
     * @param {ClassDeleteArgs} args - Arguments to delete one Class.
     * @example
     * // Delete one Class
     * const Class = await prisma.class.delete({
     *   where: {
     *     // ... filter to delete one Class
     *   }
     * })
     * 
     */
    delete<T extends ClassDeleteArgs>(args: SelectSubset<T, ClassDeleteArgs<ExtArgs>>): Prisma__ClassClient<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Class.
     * @param {ClassUpdateArgs} args - Arguments to update one Class.
     * @example
     * // Update one Class
     * const class = await prisma.class.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ClassUpdateArgs>(args: SelectSubset<T, ClassUpdateArgs<ExtArgs>>): Prisma__ClassClient<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Classes.
     * @param {ClassDeleteManyArgs} args - Arguments to filter Classes to delete.
     * @example
     * // Delete a few Classes
     * const { count } = await prisma.class.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ClassDeleteManyArgs>(args?: SelectSubset<T, ClassDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Classes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClassUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Classes
     * const class = await prisma.class.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ClassUpdateManyArgs>(args: SelectSubset<T, ClassUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Classes and returns the data updated in the database.
     * @param {ClassUpdateManyAndReturnArgs} args - Arguments to update many Classes.
     * @example
     * // Update many Classes
     * const class = await prisma.class.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Classes and only return the `id`
     * const classWithIdOnly = await prisma.class.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ClassUpdateManyAndReturnArgs>(args: SelectSubset<T, ClassUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Class.
     * @param {ClassUpsertArgs} args - Arguments to update or create a Class.
     * @example
     * // Update or create a Class
     * const class = await prisma.class.upsert({
     *   create: {
     *     // ... data to create a Class
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Class we want to update
     *   }
     * })
     */
    upsert<T extends ClassUpsertArgs>(args: SelectSubset<T, ClassUpsertArgs<ExtArgs>>): Prisma__ClassClient<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Classes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClassCountArgs} args - Arguments to filter Classes to count.
     * @example
     * // Count the number of Classes
     * const count = await prisma.class.count({
     *   where: {
     *     // ... the filter for the Classes we want to count
     *   }
     * })
    **/
    count<T extends ClassCountArgs>(
      args?: Subset<T, ClassCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ClassCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Class.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClassAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ClassAggregateArgs>(args: Subset<T, ClassAggregateArgs>): Prisma.PrismaPromise<GetClassAggregateType<T>>

    /**
     * Group by Class.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClassGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ClassGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ClassGroupByArgs['orderBy'] }
        : { orderBy?: ClassGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ClassGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetClassGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Class model
   */
  readonly fields: ClassFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Class.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ClassClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    course<T extends CourseDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CourseDefaultArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    slides<T extends Class$slidesArgs<ExtArgs> = {}>(args?: Subset<T, Class$slidesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Class model
   */
  interface ClassFieldRefs {
    readonly id: FieldRef<"Class", 'String'>
    readonly title: FieldRef<"Class", 'String'>
    readonly description: FieldRef<"Class", 'String'>
    readonly code: FieldRef<"Class", 'String'>
    readonly status: FieldRef<"Class", 'ClassStatus'>
    readonly courseId: FieldRef<"Class", 'String'>
    readonly createdAt: FieldRef<"Class", 'DateTime'>
    readonly updatedAt: FieldRef<"Class", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Class findUnique
   */
  export type ClassFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
    /**
     * Filter, which Class to fetch.
     */
    where: ClassWhereUniqueInput
  }

  /**
   * Class findUniqueOrThrow
   */
  export type ClassFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
    /**
     * Filter, which Class to fetch.
     */
    where: ClassWhereUniqueInput
  }

  /**
   * Class findFirst
   */
  export type ClassFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
    /**
     * Filter, which Class to fetch.
     */
    where?: ClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Classes to fetch.
     */
    orderBy?: ClassOrderByWithRelationInput | ClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Classes.
     */
    cursor?: ClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Classes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Classes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Classes.
     */
    distinct?: ClassScalarFieldEnum | ClassScalarFieldEnum[]
  }

  /**
   * Class findFirstOrThrow
   */
  export type ClassFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
    /**
     * Filter, which Class to fetch.
     */
    where?: ClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Classes to fetch.
     */
    orderBy?: ClassOrderByWithRelationInput | ClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Classes.
     */
    cursor?: ClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Classes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Classes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Classes.
     */
    distinct?: ClassScalarFieldEnum | ClassScalarFieldEnum[]
  }

  /**
   * Class findMany
   */
  export type ClassFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
    /**
     * Filter, which Classes to fetch.
     */
    where?: ClassWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Classes to fetch.
     */
    orderBy?: ClassOrderByWithRelationInput | ClassOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Classes.
     */
    cursor?: ClassWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Classes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Classes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Classes.
     */
    distinct?: ClassScalarFieldEnum | ClassScalarFieldEnum[]
  }

  /**
   * Class create
   */
  export type ClassCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
    /**
     * The data needed to create a Class.
     */
    data: XOR<ClassCreateInput, ClassUncheckedCreateInput>
  }

  /**
   * Class createMany
   */
  export type ClassCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Classes.
     */
    data: ClassCreateManyInput | ClassCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Class createManyAndReturn
   */
  export type ClassCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * The data used to create many Classes.
     */
    data: ClassCreateManyInput | ClassCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Class update
   */
  export type ClassUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
    /**
     * The data needed to update a Class.
     */
    data: XOR<ClassUpdateInput, ClassUncheckedUpdateInput>
    /**
     * Choose, which Class to update.
     */
    where: ClassWhereUniqueInput
  }

  /**
   * Class updateMany
   */
  export type ClassUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Classes.
     */
    data: XOR<ClassUpdateManyMutationInput, ClassUncheckedUpdateManyInput>
    /**
     * Filter which Classes to update
     */
    where?: ClassWhereInput
    /**
     * Limit how many Classes to update.
     */
    limit?: number
  }

  /**
   * Class updateManyAndReturn
   */
  export type ClassUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * The data used to update Classes.
     */
    data: XOR<ClassUpdateManyMutationInput, ClassUncheckedUpdateManyInput>
    /**
     * Filter which Classes to update
     */
    where?: ClassWhereInput
    /**
     * Limit how many Classes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Class upsert
   */
  export type ClassUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
    /**
     * The filter to search for the Class to update in case it exists.
     */
    where: ClassWhereUniqueInput
    /**
     * In case the Class found by the `where` argument doesn't exist, create a new Class with this data.
     */
    create: XOR<ClassCreateInput, ClassUncheckedCreateInput>
    /**
     * In case the Class was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ClassUpdateInput, ClassUncheckedUpdateInput>
  }

  /**
   * Class delete
   */
  export type ClassDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
    /**
     * Filter which Class to delete.
     */
    where: ClassWhereUniqueInput
  }

  /**
   * Class deleteMany
   */
  export type ClassDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Classes to delete
     */
    where?: ClassWhereInput
    /**
     * Limit how many Classes to delete.
     */
    limit?: number
  }

  /**
   * Class.slides
   */
  export type Class$slidesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
    where?: SlideWhereInput
    orderBy?: SlideOrderByWithRelationInput | SlideOrderByWithRelationInput[]
    cursor?: SlideWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SlideScalarFieldEnum | SlideScalarFieldEnum[]
  }

  /**
   * Class without action
   */
  export type ClassDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Class
     */
    select?: ClassSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Class
     */
    omit?: ClassOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClassInclude<ExtArgs> | null
  }


  /**
   * Model Slide
   */

  export type AggregateSlide = {
    _count: SlideCountAggregateOutputType | null
    _avg: SlideAvgAggregateOutputType | null
    _sum: SlideSumAggregateOutputType | null
    _min: SlideMinAggregateOutputType | null
    _max: SlideMaxAggregateOutputType | null
  }

  export type SlideAvgAggregateOutputType = {
    order: number | null
  }

  export type SlideSumAggregateOutputType = {
    order: number | null
  }

  export type SlideMinAggregateOutputType = {
    id: string | null
    order: number | null
    type: $Enums.SlideType | null
    title: string | null
    classId: string | null
    createdAt: Date | null
  }

  export type SlideMaxAggregateOutputType = {
    id: string | null
    order: number | null
    type: $Enums.SlideType | null
    title: string | null
    classId: string | null
    createdAt: Date | null
  }

  export type SlideCountAggregateOutputType = {
    id: number
    order: number
    type: number
    title: number
    content: number
    classId: number
    createdAt: number
    _all: number
  }


  export type SlideAvgAggregateInputType = {
    order?: true
  }

  export type SlideSumAggregateInputType = {
    order?: true
  }

  export type SlideMinAggregateInputType = {
    id?: true
    order?: true
    type?: true
    title?: true
    classId?: true
    createdAt?: true
  }

  export type SlideMaxAggregateInputType = {
    id?: true
    order?: true
    type?: true
    title?: true
    classId?: true
    createdAt?: true
  }

  export type SlideCountAggregateInputType = {
    id?: true
    order?: true
    type?: true
    title?: true
    content?: true
    classId?: true
    createdAt?: true
    _all?: true
  }

  export type SlideAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Slide to aggregate.
     */
    where?: SlideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Slides to fetch.
     */
    orderBy?: SlideOrderByWithRelationInput | SlideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SlideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Slides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Slides.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Slides
    **/
    _count?: true | SlideCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SlideAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SlideSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SlideMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SlideMaxAggregateInputType
  }

  export type GetSlideAggregateType<T extends SlideAggregateArgs> = {
        [P in keyof T & keyof AggregateSlide]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSlide[P]>
      : GetScalarType<T[P], AggregateSlide[P]>
  }




  export type SlideGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SlideWhereInput
    orderBy?: SlideOrderByWithAggregationInput | SlideOrderByWithAggregationInput[]
    by: SlideScalarFieldEnum[] | SlideScalarFieldEnum
    having?: SlideScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SlideCountAggregateInputType | true
    _avg?: SlideAvgAggregateInputType
    _sum?: SlideSumAggregateInputType
    _min?: SlideMinAggregateInputType
    _max?: SlideMaxAggregateInputType
  }

  export type SlideGroupByOutputType = {
    id: string
    order: number
    type: $Enums.SlideType
    title: string
    content: JsonValue | null
    classId: string
    createdAt: Date
    _count: SlideCountAggregateOutputType | null
    _avg: SlideAvgAggregateOutputType | null
    _sum: SlideSumAggregateOutputType | null
    _min: SlideMinAggregateOutputType | null
    _max: SlideMaxAggregateOutputType | null
  }

  type GetSlideGroupByPayload<T extends SlideGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SlideGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SlideGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SlideGroupByOutputType[P]>
            : GetScalarType<T[P], SlideGroupByOutputType[P]>
        }
      >
    >


  export type SlideSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    order?: boolean
    type?: boolean
    title?: boolean
    content?: boolean
    classId?: boolean
    createdAt?: boolean
    class?: boolean | ClassDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["slide"]>

  export type SlideSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    order?: boolean
    type?: boolean
    title?: boolean
    content?: boolean
    classId?: boolean
    createdAt?: boolean
    class?: boolean | ClassDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["slide"]>

  export type SlideSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    order?: boolean
    type?: boolean
    title?: boolean
    content?: boolean
    classId?: boolean
    createdAt?: boolean
    class?: boolean | ClassDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["slide"]>

  export type SlideSelectScalar = {
    id?: boolean
    order?: boolean
    type?: boolean
    title?: boolean
    content?: boolean
    classId?: boolean
    createdAt?: boolean
  }

  export type SlideOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "order" | "type" | "title" | "content" | "classId" | "createdAt", ExtArgs["result"]["slide"]>
  export type SlideInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    class?: boolean | ClassDefaultArgs<ExtArgs>
  }
  export type SlideIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    class?: boolean | ClassDefaultArgs<ExtArgs>
  }
  export type SlideIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    class?: boolean | ClassDefaultArgs<ExtArgs>
  }

  export type $SlidePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Slide"
    objects: {
      class: Prisma.$ClassPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      order: number
      type: $Enums.SlideType
      title: string
      content: Prisma.JsonValue | null
      classId: string
      createdAt: Date
    }, ExtArgs["result"]["slide"]>
    composites: {}
  }

  type SlideGetPayload<S extends boolean | null | undefined | SlideDefaultArgs> = $Result.GetResult<Prisma.$SlidePayload, S>

  type SlideCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SlideFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SlideCountAggregateInputType | true
    }

  export interface SlideDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Slide'], meta: { name: 'Slide' } }
    /**
     * Find zero or one Slide that matches the filter.
     * @param {SlideFindUniqueArgs} args - Arguments to find a Slide
     * @example
     * // Get one Slide
     * const slide = await prisma.slide.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SlideFindUniqueArgs>(args: SelectSubset<T, SlideFindUniqueArgs<ExtArgs>>): Prisma__SlideClient<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Slide that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SlideFindUniqueOrThrowArgs} args - Arguments to find a Slide
     * @example
     * // Get one Slide
     * const slide = await prisma.slide.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SlideFindUniqueOrThrowArgs>(args: SelectSubset<T, SlideFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SlideClient<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Slide that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlideFindFirstArgs} args - Arguments to find a Slide
     * @example
     * // Get one Slide
     * const slide = await prisma.slide.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SlideFindFirstArgs>(args?: SelectSubset<T, SlideFindFirstArgs<ExtArgs>>): Prisma__SlideClient<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Slide that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlideFindFirstOrThrowArgs} args - Arguments to find a Slide
     * @example
     * // Get one Slide
     * const slide = await prisma.slide.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SlideFindFirstOrThrowArgs>(args?: SelectSubset<T, SlideFindFirstOrThrowArgs<ExtArgs>>): Prisma__SlideClient<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Slides that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlideFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Slides
     * const slides = await prisma.slide.findMany()
     * 
     * // Get first 10 Slides
     * const slides = await prisma.slide.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const slideWithIdOnly = await prisma.slide.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SlideFindManyArgs>(args?: SelectSubset<T, SlideFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Slide.
     * @param {SlideCreateArgs} args - Arguments to create a Slide.
     * @example
     * // Create one Slide
     * const Slide = await prisma.slide.create({
     *   data: {
     *     // ... data to create a Slide
     *   }
     * })
     * 
     */
    create<T extends SlideCreateArgs>(args: SelectSubset<T, SlideCreateArgs<ExtArgs>>): Prisma__SlideClient<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Slides.
     * @param {SlideCreateManyArgs} args - Arguments to create many Slides.
     * @example
     * // Create many Slides
     * const slide = await prisma.slide.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SlideCreateManyArgs>(args?: SelectSubset<T, SlideCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Slides and returns the data saved in the database.
     * @param {SlideCreateManyAndReturnArgs} args - Arguments to create many Slides.
     * @example
     * // Create many Slides
     * const slide = await prisma.slide.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Slides and only return the `id`
     * const slideWithIdOnly = await prisma.slide.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SlideCreateManyAndReturnArgs>(args?: SelectSubset<T, SlideCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Slide.
     * @param {SlideDeleteArgs} args - Arguments to delete one Slide.
     * @example
     * // Delete one Slide
     * const Slide = await prisma.slide.delete({
     *   where: {
     *     // ... filter to delete one Slide
     *   }
     * })
     * 
     */
    delete<T extends SlideDeleteArgs>(args: SelectSubset<T, SlideDeleteArgs<ExtArgs>>): Prisma__SlideClient<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Slide.
     * @param {SlideUpdateArgs} args - Arguments to update one Slide.
     * @example
     * // Update one Slide
     * const slide = await prisma.slide.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SlideUpdateArgs>(args: SelectSubset<T, SlideUpdateArgs<ExtArgs>>): Prisma__SlideClient<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Slides.
     * @param {SlideDeleteManyArgs} args - Arguments to filter Slides to delete.
     * @example
     * // Delete a few Slides
     * const { count } = await prisma.slide.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SlideDeleteManyArgs>(args?: SelectSubset<T, SlideDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Slides.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlideUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Slides
     * const slide = await prisma.slide.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SlideUpdateManyArgs>(args: SelectSubset<T, SlideUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Slides and returns the data updated in the database.
     * @param {SlideUpdateManyAndReturnArgs} args - Arguments to update many Slides.
     * @example
     * // Update many Slides
     * const slide = await prisma.slide.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Slides and only return the `id`
     * const slideWithIdOnly = await prisma.slide.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SlideUpdateManyAndReturnArgs>(args: SelectSubset<T, SlideUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Slide.
     * @param {SlideUpsertArgs} args - Arguments to update or create a Slide.
     * @example
     * // Update or create a Slide
     * const slide = await prisma.slide.upsert({
     *   create: {
     *     // ... data to create a Slide
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Slide we want to update
     *   }
     * })
     */
    upsert<T extends SlideUpsertArgs>(args: SelectSubset<T, SlideUpsertArgs<ExtArgs>>): Prisma__SlideClient<$Result.GetResult<Prisma.$SlidePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Slides.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlideCountArgs} args - Arguments to filter Slides to count.
     * @example
     * // Count the number of Slides
     * const count = await prisma.slide.count({
     *   where: {
     *     // ... the filter for the Slides we want to count
     *   }
     * })
    **/
    count<T extends SlideCountArgs>(
      args?: Subset<T, SlideCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SlideCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Slide.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlideAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SlideAggregateArgs>(args: Subset<T, SlideAggregateArgs>): Prisma.PrismaPromise<GetSlideAggregateType<T>>

    /**
     * Group by Slide.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SlideGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SlideGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SlideGroupByArgs['orderBy'] }
        : { orderBy?: SlideGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SlideGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSlideGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Slide model
   */
  readonly fields: SlideFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Slide.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SlideClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    class<T extends ClassDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ClassDefaultArgs<ExtArgs>>): Prisma__ClassClient<$Result.GetResult<Prisma.$ClassPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Slide model
   */
  interface SlideFieldRefs {
    readonly id: FieldRef<"Slide", 'String'>
    readonly order: FieldRef<"Slide", 'Int'>
    readonly type: FieldRef<"Slide", 'SlideType'>
    readonly title: FieldRef<"Slide", 'String'>
    readonly content: FieldRef<"Slide", 'Json'>
    readonly classId: FieldRef<"Slide", 'String'>
    readonly createdAt: FieldRef<"Slide", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Slide findUnique
   */
  export type SlideFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
    /**
     * Filter, which Slide to fetch.
     */
    where: SlideWhereUniqueInput
  }

  /**
   * Slide findUniqueOrThrow
   */
  export type SlideFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
    /**
     * Filter, which Slide to fetch.
     */
    where: SlideWhereUniqueInput
  }

  /**
   * Slide findFirst
   */
  export type SlideFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
    /**
     * Filter, which Slide to fetch.
     */
    where?: SlideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Slides to fetch.
     */
    orderBy?: SlideOrderByWithRelationInput | SlideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Slides.
     */
    cursor?: SlideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Slides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Slides.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Slides.
     */
    distinct?: SlideScalarFieldEnum | SlideScalarFieldEnum[]
  }

  /**
   * Slide findFirstOrThrow
   */
  export type SlideFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
    /**
     * Filter, which Slide to fetch.
     */
    where?: SlideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Slides to fetch.
     */
    orderBy?: SlideOrderByWithRelationInput | SlideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Slides.
     */
    cursor?: SlideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Slides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Slides.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Slides.
     */
    distinct?: SlideScalarFieldEnum | SlideScalarFieldEnum[]
  }

  /**
   * Slide findMany
   */
  export type SlideFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
    /**
     * Filter, which Slides to fetch.
     */
    where?: SlideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Slides to fetch.
     */
    orderBy?: SlideOrderByWithRelationInput | SlideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Slides.
     */
    cursor?: SlideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Slides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Slides.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Slides.
     */
    distinct?: SlideScalarFieldEnum | SlideScalarFieldEnum[]
  }

  /**
   * Slide create
   */
  export type SlideCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
    /**
     * The data needed to create a Slide.
     */
    data: XOR<SlideCreateInput, SlideUncheckedCreateInput>
  }

  /**
   * Slide createMany
   */
  export type SlideCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Slides.
     */
    data: SlideCreateManyInput | SlideCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Slide createManyAndReturn
   */
  export type SlideCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * The data used to create many Slides.
     */
    data: SlideCreateManyInput | SlideCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Slide update
   */
  export type SlideUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
    /**
     * The data needed to update a Slide.
     */
    data: XOR<SlideUpdateInput, SlideUncheckedUpdateInput>
    /**
     * Choose, which Slide to update.
     */
    where: SlideWhereUniqueInput
  }

  /**
   * Slide updateMany
   */
  export type SlideUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Slides.
     */
    data: XOR<SlideUpdateManyMutationInput, SlideUncheckedUpdateManyInput>
    /**
     * Filter which Slides to update
     */
    where?: SlideWhereInput
    /**
     * Limit how many Slides to update.
     */
    limit?: number
  }

  /**
   * Slide updateManyAndReturn
   */
  export type SlideUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * The data used to update Slides.
     */
    data: XOR<SlideUpdateManyMutationInput, SlideUncheckedUpdateManyInput>
    /**
     * Filter which Slides to update
     */
    where?: SlideWhereInput
    /**
     * Limit how many Slides to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Slide upsert
   */
  export type SlideUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
    /**
     * The filter to search for the Slide to update in case it exists.
     */
    where: SlideWhereUniqueInput
    /**
     * In case the Slide found by the `where` argument doesn't exist, create a new Slide with this data.
     */
    create: XOR<SlideCreateInput, SlideUncheckedCreateInput>
    /**
     * In case the Slide was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SlideUpdateInput, SlideUncheckedUpdateInput>
  }

  /**
   * Slide delete
   */
  export type SlideDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
    /**
     * Filter which Slide to delete.
     */
    where: SlideWhereUniqueInput
  }

  /**
   * Slide deleteMany
   */
  export type SlideDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Slides to delete
     */
    where?: SlideWhereInput
    /**
     * Limit how many Slides to delete.
     */
    limit?: number
  }

  /**
   * Slide without action
   */
  export type SlideDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Slide
     */
    select?: SlideSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Slide
     */
    omit?: SlideOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SlideInclude<ExtArgs> | null
  }


  /**
   * Model GradebookStructure
   */

  export type AggregateGradebookStructure = {
    _count: GradebookStructureCountAggregateOutputType | null
    _min: GradebookStructureMinAggregateOutputType | null
    _max: GradebookStructureMaxAggregateOutputType | null
  }

  export type GradebookStructureMinAggregateOutputType = {
    id: string | null
    courseId: string | null
  }

  export type GradebookStructureMaxAggregateOutputType = {
    id: string | null
    courseId: string | null
  }

  export type GradebookStructureCountAggregateOutputType = {
    id: number
    courseId: number
    _all: number
  }


  export type GradebookStructureMinAggregateInputType = {
    id?: true
    courseId?: true
  }

  export type GradebookStructureMaxAggregateInputType = {
    id?: true
    courseId?: true
  }

  export type GradebookStructureCountAggregateInputType = {
    id?: true
    courseId?: true
    _all?: true
  }

  export type GradebookStructureAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GradebookStructure to aggregate.
     */
    where?: GradebookStructureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GradebookStructures to fetch.
     */
    orderBy?: GradebookStructureOrderByWithRelationInput | GradebookStructureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GradebookStructureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GradebookStructures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GradebookStructures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GradebookStructures
    **/
    _count?: true | GradebookStructureCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GradebookStructureMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GradebookStructureMaxAggregateInputType
  }

  export type GetGradebookStructureAggregateType<T extends GradebookStructureAggregateArgs> = {
        [P in keyof T & keyof AggregateGradebookStructure]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGradebookStructure[P]>
      : GetScalarType<T[P], AggregateGradebookStructure[P]>
  }




  export type GradebookStructureGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GradebookStructureWhereInput
    orderBy?: GradebookStructureOrderByWithAggregationInput | GradebookStructureOrderByWithAggregationInput[]
    by: GradebookStructureScalarFieldEnum[] | GradebookStructureScalarFieldEnum
    having?: GradebookStructureScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GradebookStructureCountAggregateInputType | true
    _min?: GradebookStructureMinAggregateInputType
    _max?: GradebookStructureMaxAggregateInputType
  }

  export type GradebookStructureGroupByOutputType = {
    id: string
    courseId: string
    _count: GradebookStructureCountAggregateOutputType | null
    _min: GradebookStructureMinAggregateOutputType | null
    _max: GradebookStructureMaxAggregateOutputType | null
  }

  type GetGradebookStructureGroupByPayload<T extends GradebookStructureGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GradebookStructureGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GradebookStructureGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GradebookStructureGroupByOutputType[P]>
            : GetScalarType<T[P], GradebookStructureGroupByOutputType[P]>
        }
      >
    >


  export type GradebookStructureSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    courseId?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
    aspects?: boolean | GradebookStructure$aspectsArgs<ExtArgs>
    _count?: boolean | GradebookStructureCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gradebookStructure"]>

  export type GradebookStructureSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    courseId?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gradebookStructure"]>

  export type GradebookStructureSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    courseId?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gradebookStructure"]>

  export type GradebookStructureSelectScalar = {
    id?: boolean
    courseId?: boolean
  }

  export type GradebookStructureOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "courseId", ExtArgs["result"]["gradebookStructure"]>
  export type GradebookStructureInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
    aspects?: boolean | GradebookStructure$aspectsArgs<ExtArgs>
    _count?: boolean | GradebookStructureCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GradebookStructureIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }
  export type GradebookStructureIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }

  export type $GradebookStructurePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GradebookStructure"
    objects: {
      course: Prisma.$CoursePayload<ExtArgs>
      aspects: Prisma.$AspectPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      courseId: string
    }, ExtArgs["result"]["gradebookStructure"]>
    composites: {}
  }

  type GradebookStructureGetPayload<S extends boolean | null | undefined | GradebookStructureDefaultArgs> = $Result.GetResult<Prisma.$GradebookStructurePayload, S>

  type GradebookStructureCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GradebookStructureFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GradebookStructureCountAggregateInputType | true
    }

  export interface GradebookStructureDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GradebookStructure'], meta: { name: 'GradebookStructure' } }
    /**
     * Find zero or one GradebookStructure that matches the filter.
     * @param {GradebookStructureFindUniqueArgs} args - Arguments to find a GradebookStructure
     * @example
     * // Get one GradebookStructure
     * const gradebookStructure = await prisma.gradebookStructure.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GradebookStructureFindUniqueArgs>(args: SelectSubset<T, GradebookStructureFindUniqueArgs<ExtArgs>>): Prisma__GradebookStructureClient<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GradebookStructure that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GradebookStructureFindUniqueOrThrowArgs} args - Arguments to find a GradebookStructure
     * @example
     * // Get one GradebookStructure
     * const gradebookStructure = await prisma.gradebookStructure.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GradebookStructureFindUniqueOrThrowArgs>(args: SelectSubset<T, GradebookStructureFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GradebookStructureClient<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GradebookStructure that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradebookStructureFindFirstArgs} args - Arguments to find a GradebookStructure
     * @example
     * // Get one GradebookStructure
     * const gradebookStructure = await prisma.gradebookStructure.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GradebookStructureFindFirstArgs>(args?: SelectSubset<T, GradebookStructureFindFirstArgs<ExtArgs>>): Prisma__GradebookStructureClient<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GradebookStructure that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradebookStructureFindFirstOrThrowArgs} args - Arguments to find a GradebookStructure
     * @example
     * // Get one GradebookStructure
     * const gradebookStructure = await prisma.gradebookStructure.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GradebookStructureFindFirstOrThrowArgs>(args?: SelectSubset<T, GradebookStructureFindFirstOrThrowArgs<ExtArgs>>): Prisma__GradebookStructureClient<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GradebookStructures that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradebookStructureFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GradebookStructures
     * const gradebookStructures = await prisma.gradebookStructure.findMany()
     * 
     * // Get first 10 GradebookStructures
     * const gradebookStructures = await prisma.gradebookStructure.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const gradebookStructureWithIdOnly = await prisma.gradebookStructure.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GradebookStructureFindManyArgs>(args?: SelectSubset<T, GradebookStructureFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GradebookStructure.
     * @param {GradebookStructureCreateArgs} args - Arguments to create a GradebookStructure.
     * @example
     * // Create one GradebookStructure
     * const GradebookStructure = await prisma.gradebookStructure.create({
     *   data: {
     *     // ... data to create a GradebookStructure
     *   }
     * })
     * 
     */
    create<T extends GradebookStructureCreateArgs>(args: SelectSubset<T, GradebookStructureCreateArgs<ExtArgs>>): Prisma__GradebookStructureClient<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GradebookStructures.
     * @param {GradebookStructureCreateManyArgs} args - Arguments to create many GradebookStructures.
     * @example
     * // Create many GradebookStructures
     * const gradebookStructure = await prisma.gradebookStructure.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GradebookStructureCreateManyArgs>(args?: SelectSubset<T, GradebookStructureCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GradebookStructures and returns the data saved in the database.
     * @param {GradebookStructureCreateManyAndReturnArgs} args - Arguments to create many GradebookStructures.
     * @example
     * // Create many GradebookStructures
     * const gradebookStructure = await prisma.gradebookStructure.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GradebookStructures and only return the `id`
     * const gradebookStructureWithIdOnly = await prisma.gradebookStructure.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GradebookStructureCreateManyAndReturnArgs>(args?: SelectSubset<T, GradebookStructureCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GradebookStructure.
     * @param {GradebookStructureDeleteArgs} args - Arguments to delete one GradebookStructure.
     * @example
     * // Delete one GradebookStructure
     * const GradebookStructure = await prisma.gradebookStructure.delete({
     *   where: {
     *     // ... filter to delete one GradebookStructure
     *   }
     * })
     * 
     */
    delete<T extends GradebookStructureDeleteArgs>(args: SelectSubset<T, GradebookStructureDeleteArgs<ExtArgs>>): Prisma__GradebookStructureClient<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GradebookStructure.
     * @param {GradebookStructureUpdateArgs} args - Arguments to update one GradebookStructure.
     * @example
     * // Update one GradebookStructure
     * const gradebookStructure = await prisma.gradebookStructure.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GradebookStructureUpdateArgs>(args: SelectSubset<T, GradebookStructureUpdateArgs<ExtArgs>>): Prisma__GradebookStructureClient<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GradebookStructures.
     * @param {GradebookStructureDeleteManyArgs} args - Arguments to filter GradebookStructures to delete.
     * @example
     * // Delete a few GradebookStructures
     * const { count } = await prisma.gradebookStructure.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GradebookStructureDeleteManyArgs>(args?: SelectSubset<T, GradebookStructureDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GradebookStructures.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradebookStructureUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GradebookStructures
     * const gradebookStructure = await prisma.gradebookStructure.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GradebookStructureUpdateManyArgs>(args: SelectSubset<T, GradebookStructureUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GradebookStructures and returns the data updated in the database.
     * @param {GradebookStructureUpdateManyAndReturnArgs} args - Arguments to update many GradebookStructures.
     * @example
     * // Update many GradebookStructures
     * const gradebookStructure = await prisma.gradebookStructure.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GradebookStructures and only return the `id`
     * const gradebookStructureWithIdOnly = await prisma.gradebookStructure.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GradebookStructureUpdateManyAndReturnArgs>(args: SelectSubset<T, GradebookStructureUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GradebookStructure.
     * @param {GradebookStructureUpsertArgs} args - Arguments to update or create a GradebookStructure.
     * @example
     * // Update or create a GradebookStructure
     * const gradebookStructure = await prisma.gradebookStructure.upsert({
     *   create: {
     *     // ... data to create a GradebookStructure
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GradebookStructure we want to update
     *   }
     * })
     */
    upsert<T extends GradebookStructureUpsertArgs>(args: SelectSubset<T, GradebookStructureUpsertArgs<ExtArgs>>): Prisma__GradebookStructureClient<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GradebookStructures.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradebookStructureCountArgs} args - Arguments to filter GradebookStructures to count.
     * @example
     * // Count the number of GradebookStructures
     * const count = await prisma.gradebookStructure.count({
     *   where: {
     *     // ... the filter for the GradebookStructures we want to count
     *   }
     * })
    **/
    count<T extends GradebookStructureCountArgs>(
      args?: Subset<T, GradebookStructureCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GradebookStructureCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GradebookStructure.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradebookStructureAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GradebookStructureAggregateArgs>(args: Subset<T, GradebookStructureAggregateArgs>): Prisma.PrismaPromise<GetGradebookStructureAggregateType<T>>

    /**
     * Group by GradebookStructure.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradebookStructureGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GradebookStructureGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GradebookStructureGroupByArgs['orderBy'] }
        : { orderBy?: GradebookStructureGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GradebookStructureGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGradebookStructureGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GradebookStructure model
   */
  readonly fields: GradebookStructureFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GradebookStructure.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GradebookStructureClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    course<T extends CourseDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CourseDefaultArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    aspects<T extends GradebookStructure$aspectsArgs<ExtArgs> = {}>(args?: Subset<T, GradebookStructure$aspectsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the GradebookStructure model
   */
  interface GradebookStructureFieldRefs {
    readonly id: FieldRef<"GradebookStructure", 'String'>
    readonly courseId: FieldRef<"GradebookStructure", 'String'>
  }
    

  // Custom InputTypes
  /**
   * GradebookStructure findUnique
   */
  export type GradebookStructureFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
    /**
     * Filter, which GradebookStructure to fetch.
     */
    where: GradebookStructureWhereUniqueInput
  }

  /**
   * GradebookStructure findUniqueOrThrow
   */
  export type GradebookStructureFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
    /**
     * Filter, which GradebookStructure to fetch.
     */
    where: GradebookStructureWhereUniqueInput
  }

  /**
   * GradebookStructure findFirst
   */
  export type GradebookStructureFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
    /**
     * Filter, which GradebookStructure to fetch.
     */
    where?: GradebookStructureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GradebookStructures to fetch.
     */
    orderBy?: GradebookStructureOrderByWithRelationInput | GradebookStructureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GradebookStructures.
     */
    cursor?: GradebookStructureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GradebookStructures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GradebookStructures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GradebookStructures.
     */
    distinct?: GradebookStructureScalarFieldEnum | GradebookStructureScalarFieldEnum[]
  }

  /**
   * GradebookStructure findFirstOrThrow
   */
  export type GradebookStructureFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
    /**
     * Filter, which GradebookStructure to fetch.
     */
    where?: GradebookStructureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GradebookStructures to fetch.
     */
    orderBy?: GradebookStructureOrderByWithRelationInput | GradebookStructureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GradebookStructures.
     */
    cursor?: GradebookStructureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GradebookStructures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GradebookStructures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GradebookStructures.
     */
    distinct?: GradebookStructureScalarFieldEnum | GradebookStructureScalarFieldEnum[]
  }

  /**
   * GradebookStructure findMany
   */
  export type GradebookStructureFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
    /**
     * Filter, which GradebookStructures to fetch.
     */
    where?: GradebookStructureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GradebookStructures to fetch.
     */
    orderBy?: GradebookStructureOrderByWithRelationInput | GradebookStructureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GradebookStructures.
     */
    cursor?: GradebookStructureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GradebookStructures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GradebookStructures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GradebookStructures.
     */
    distinct?: GradebookStructureScalarFieldEnum | GradebookStructureScalarFieldEnum[]
  }

  /**
   * GradebookStructure create
   */
  export type GradebookStructureCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
    /**
     * The data needed to create a GradebookStructure.
     */
    data: XOR<GradebookStructureCreateInput, GradebookStructureUncheckedCreateInput>
  }

  /**
   * GradebookStructure createMany
   */
  export type GradebookStructureCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GradebookStructures.
     */
    data: GradebookStructureCreateManyInput | GradebookStructureCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * GradebookStructure createManyAndReturn
   */
  export type GradebookStructureCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * The data used to create many GradebookStructures.
     */
    data: GradebookStructureCreateManyInput | GradebookStructureCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * GradebookStructure update
   */
  export type GradebookStructureUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
    /**
     * The data needed to update a GradebookStructure.
     */
    data: XOR<GradebookStructureUpdateInput, GradebookStructureUncheckedUpdateInput>
    /**
     * Choose, which GradebookStructure to update.
     */
    where: GradebookStructureWhereUniqueInput
  }

  /**
   * GradebookStructure updateMany
   */
  export type GradebookStructureUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GradebookStructures.
     */
    data: XOR<GradebookStructureUpdateManyMutationInput, GradebookStructureUncheckedUpdateManyInput>
    /**
     * Filter which GradebookStructures to update
     */
    where?: GradebookStructureWhereInput
    /**
     * Limit how many GradebookStructures to update.
     */
    limit?: number
  }

  /**
   * GradebookStructure updateManyAndReturn
   */
  export type GradebookStructureUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * The data used to update GradebookStructures.
     */
    data: XOR<GradebookStructureUpdateManyMutationInput, GradebookStructureUncheckedUpdateManyInput>
    /**
     * Filter which GradebookStructures to update
     */
    where?: GradebookStructureWhereInput
    /**
     * Limit how many GradebookStructures to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * GradebookStructure upsert
   */
  export type GradebookStructureUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
    /**
     * The filter to search for the GradebookStructure to update in case it exists.
     */
    where: GradebookStructureWhereUniqueInput
    /**
     * In case the GradebookStructure found by the `where` argument doesn't exist, create a new GradebookStructure with this data.
     */
    create: XOR<GradebookStructureCreateInput, GradebookStructureUncheckedCreateInput>
    /**
     * In case the GradebookStructure was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GradebookStructureUpdateInput, GradebookStructureUncheckedUpdateInput>
  }

  /**
   * GradebookStructure delete
   */
  export type GradebookStructureDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
    /**
     * Filter which GradebookStructure to delete.
     */
    where: GradebookStructureWhereUniqueInput
  }

  /**
   * GradebookStructure deleteMany
   */
  export type GradebookStructureDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GradebookStructures to delete
     */
    where?: GradebookStructureWhereInput
    /**
     * Limit how many GradebookStructures to delete.
     */
    limit?: number
  }

  /**
   * GradebookStructure.aspects
   */
  export type GradebookStructure$aspectsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
    where?: AspectWhereInput
    orderBy?: AspectOrderByWithRelationInput | AspectOrderByWithRelationInput[]
    cursor?: AspectWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AspectScalarFieldEnum | AspectScalarFieldEnum[]
  }

  /**
   * GradebookStructure without action
   */
  export type GradebookStructureDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradebookStructure
     */
    select?: GradebookStructureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradebookStructure
     */
    omit?: GradebookStructureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradebookStructureInclude<ExtArgs> | null
  }


  /**
   * Model Aspect
   */

  export type AggregateAspect = {
    _count: AspectCountAggregateOutputType | null
    _avg: AspectAvgAggregateOutputType | null
    _sum: AspectSumAggregateOutputType | null
    _min: AspectMinAggregateOutputType | null
    _max: AspectMaxAggregateOutputType | null
  }

  export type AspectAvgAggregateOutputType = {
    weight: number | null
  }

  export type AspectSumAggregateOutputType = {
    weight: number | null
  }

  export type AspectMinAggregateOutputType = {
    id: string | null
    name: string | null
    weight: number | null
    structureId: string | null
  }

  export type AspectMaxAggregateOutputType = {
    id: string | null
    name: string | null
    weight: number | null
    structureId: string | null
  }

  export type AspectCountAggregateOutputType = {
    id: number
    name: number
    weight: number
    structureId: number
    _all: number
  }


  export type AspectAvgAggregateInputType = {
    weight?: true
  }

  export type AspectSumAggregateInputType = {
    weight?: true
  }

  export type AspectMinAggregateInputType = {
    id?: true
    name?: true
    weight?: true
    structureId?: true
  }

  export type AspectMaxAggregateInputType = {
    id?: true
    name?: true
    weight?: true
    structureId?: true
  }

  export type AspectCountAggregateInputType = {
    id?: true
    name?: true
    weight?: true
    structureId?: true
    _all?: true
  }

  export type AspectAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Aspect to aggregate.
     */
    where?: AspectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Aspects to fetch.
     */
    orderBy?: AspectOrderByWithRelationInput | AspectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AspectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Aspects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Aspects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Aspects
    **/
    _count?: true | AspectCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AspectAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AspectSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AspectMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AspectMaxAggregateInputType
  }

  export type GetAspectAggregateType<T extends AspectAggregateArgs> = {
        [P in keyof T & keyof AggregateAspect]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAspect[P]>
      : GetScalarType<T[P], AggregateAspect[P]>
  }




  export type AspectGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AspectWhereInput
    orderBy?: AspectOrderByWithAggregationInput | AspectOrderByWithAggregationInput[]
    by: AspectScalarFieldEnum[] | AspectScalarFieldEnum
    having?: AspectScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AspectCountAggregateInputType | true
    _avg?: AspectAvgAggregateInputType
    _sum?: AspectSumAggregateInputType
    _min?: AspectMinAggregateInputType
    _max?: AspectMaxAggregateInputType
  }

  export type AspectGroupByOutputType = {
    id: string
    name: string
    weight: number
    structureId: string
    _count: AspectCountAggregateOutputType | null
    _avg: AspectAvgAggregateOutputType | null
    _sum: AspectSumAggregateOutputType | null
    _min: AspectMinAggregateOutputType | null
    _max: AspectMaxAggregateOutputType | null
  }

  type GetAspectGroupByPayload<T extends AspectGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AspectGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AspectGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AspectGroupByOutputType[P]>
            : GetScalarType<T[P], AspectGroupByOutputType[P]>
        }
      >
    >


  export type AspectSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    weight?: boolean
    structureId?: boolean
    structure?: boolean | GradebookStructureDefaultArgs<ExtArgs>
    indicators?: boolean | Aspect$indicatorsArgs<ExtArgs>
    _count?: boolean | AspectCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aspect"]>

  export type AspectSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    weight?: boolean
    structureId?: boolean
    structure?: boolean | GradebookStructureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aspect"]>

  export type AspectSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    weight?: boolean
    structureId?: boolean
    structure?: boolean | GradebookStructureDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aspect"]>

  export type AspectSelectScalar = {
    id?: boolean
    name?: boolean
    weight?: boolean
    structureId?: boolean
  }

  export type AspectOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "weight" | "structureId", ExtArgs["result"]["aspect"]>
  export type AspectInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    structure?: boolean | GradebookStructureDefaultArgs<ExtArgs>
    indicators?: boolean | Aspect$indicatorsArgs<ExtArgs>
    _count?: boolean | AspectCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AspectIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    structure?: boolean | GradebookStructureDefaultArgs<ExtArgs>
  }
  export type AspectIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    structure?: boolean | GradebookStructureDefaultArgs<ExtArgs>
  }

  export type $AspectPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Aspect"
    objects: {
      structure: Prisma.$GradebookStructurePayload<ExtArgs>
      indicators: Prisma.$IndicatorPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      weight: number
      structureId: string
    }, ExtArgs["result"]["aspect"]>
    composites: {}
  }

  type AspectGetPayload<S extends boolean | null | undefined | AspectDefaultArgs> = $Result.GetResult<Prisma.$AspectPayload, S>

  type AspectCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AspectFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AspectCountAggregateInputType | true
    }

  export interface AspectDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Aspect'], meta: { name: 'Aspect' } }
    /**
     * Find zero or one Aspect that matches the filter.
     * @param {AspectFindUniqueArgs} args - Arguments to find a Aspect
     * @example
     * // Get one Aspect
     * const aspect = await prisma.aspect.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AspectFindUniqueArgs>(args: SelectSubset<T, AspectFindUniqueArgs<ExtArgs>>): Prisma__AspectClient<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Aspect that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AspectFindUniqueOrThrowArgs} args - Arguments to find a Aspect
     * @example
     * // Get one Aspect
     * const aspect = await prisma.aspect.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AspectFindUniqueOrThrowArgs>(args: SelectSubset<T, AspectFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AspectClient<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Aspect that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AspectFindFirstArgs} args - Arguments to find a Aspect
     * @example
     * // Get one Aspect
     * const aspect = await prisma.aspect.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AspectFindFirstArgs>(args?: SelectSubset<T, AspectFindFirstArgs<ExtArgs>>): Prisma__AspectClient<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Aspect that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AspectFindFirstOrThrowArgs} args - Arguments to find a Aspect
     * @example
     * // Get one Aspect
     * const aspect = await prisma.aspect.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AspectFindFirstOrThrowArgs>(args?: SelectSubset<T, AspectFindFirstOrThrowArgs<ExtArgs>>): Prisma__AspectClient<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Aspects that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AspectFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Aspects
     * const aspects = await prisma.aspect.findMany()
     * 
     * // Get first 10 Aspects
     * const aspects = await prisma.aspect.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const aspectWithIdOnly = await prisma.aspect.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AspectFindManyArgs>(args?: SelectSubset<T, AspectFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Aspect.
     * @param {AspectCreateArgs} args - Arguments to create a Aspect.
     * @example
     * // Create one Aspect
     * const Aspect = await prisma.aspect.create({
     *   data: {
     *     // ... data to create a Aspect
     *   }
     * })
     * 
     */
    create<T extends AspectCreateArgs>(args: SelectSubset<T, AspectCreateArgs<ExtArgs>>): Prisma__AspectClient<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Aspects.
     * @param {AspectCreateManyArgs} args - Arguments to create many Aspects.
     * @example
     * // Create many Aspects
     * const aspect = await prisma.aspect.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AspectCreateManyArgs>(args?: SelectSubset<T, AspectCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Aspects and returns the data saved in the database.
     * @param {AspectCreateManyAndReturnArgs} args - Arguments to create many Aspects.
     * @example
     * // Create many Aspects
     * const aspect = await prisma.aspect.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Aspects and only return the `id`
     * const aspectWithIdOnly = await prisma.aspect.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AspectCreateManyAndReturnArgs>(args?: SelectSubset<T, AspectCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Aspect.
     * @param {AspectDeleteArgs} args - Arguments to delete one Aspect.
     * @example
     * // Delete one Aspect
     * const Aspect = await prisma.aspect.delete({
     *   where: {
     *     // ... filter to delete one Aspect
     *   }
     * })
     * 
     */
    delete<T extends AspectDeleteArgs>(args: SelectSubset<T, AspectDeleteArgs<ExtArgs>>): Prisma__AspectClient<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Aspect.
     * @param {AspectUpdateArgs} args - Arguments to update one Aspect.
     * @example
     * // Update one Aspect
     * const aspect = await prisma.aspect.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AspectUpdateArgs>(args: SelectSubset<T, AspectUpdateArgs<ExtArgs>>): Prisma__AspectClient<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Aspects.
     * @param {AspectDeleteManyArgs} args - Arguments to filter Aspects to delete.
     * @example
     * // Delete a few Aspects
     * const { count } = await prisma.aspect.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AspectDeleteManyArgs>(args?: SelectSubset<T, AspectDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Aspects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AspectUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Aspects
     * const aspect = await prisma.aspect.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AspectUpdateManyArgs>(args: SelectSubset<T, AspectUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Aspects and returns the data updated in the database.
     * @param {AspectUpdateManyAndReturnArgs} args - Arguments to update many Aspects.
     * @example
     * // Update many Aspects
     * const aspect = await prisma.aspect.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Aspects and only return the `id`
     * const aspectWithIdOnly = await prisma.aspect.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AspectUpdateManyAndReturnArgs>(args: SelectSubset<T, AspectUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Aspect.
     * @param {AspectUpsertArgs} args - Arguments to update or create a Aspect.
     * @example
     * // Update or create a Aspect
     * const aspect = await prisma.aspect.upsert({
     *   create: {
     *     // ... data to create a Aspect
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Aspect we want to update
     *   }
     * })
     */
    upsert<T extends AspectUpsertArgs>(args: SelectSubset<T, AspectUpsertArgs<ExtArgs>>): Prisma__AspectClient<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Aspects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AspectCountArgs} args - Arguments to filter Aspects to count.
     * @example
     * // Count the number of Aspects
     * const count = await prisma.aspect.count({
     *   where: {
     *     // ... the filter for the Aspects we want to count
     *   }
     * })
    **/
    count<T extends AspectCountArgs>(
      args?: Subset<T, AspectCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AspectCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Aspect.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AspectAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AspectAggregateArgs>(args: Subset<T, AspectAggregateArgs>): Prisma.PrismaPromise<GetAspectAggregateType<T>>

    /**
     * Group by Aspect.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AspectGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AspectGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AspectGroupByArgs['orderBy'] }
        : { orderBy?: AspectGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AspectGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAspectGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Aspect model
   */
  readonly fields: AspectFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Aspect.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AspectClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    structure<T extends GradebookStructureDefaultArgs<ExtArgs> = {}>(args?: Subset<T, GradebookStructureDefaultArgs<ExtArgs>>): Prisma__GradebookStructureClient<$Result.GetResult<Prisma.$GradebookStructurePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    indicators<T extends Aspect$indicatorsArgs<ExtArgs> = {}>(args?: Subset<T, Aspect$indicatorsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Aspect model
   */
  interface AspectFieldRefs {
    readonly id: FieldRef<"Aspect", 'String'>
    readonly name: FieldRef<"Aspect", 'String'>
    readonly weight: FieldRef<"Aspect", 'Float'>
    readonly structureId: FieldRef<"Aspect", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Aspect findUnique
   */
  export type AspectFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
    /**
     * Filter, which Aspect to fetch.
     */
    where: AspectWhereUniqueInput
  }

  /**
   * Aspect findUniqueOrThrow
   */
  export type AspectFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
    /**
     * Filter, which Aspect to fetch.
     */
    where: AspectWhereUniqueInput
  }

  /**
   * Aspect findFirst
   */
  export type AspectFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
    /**
     * Filter, which Aspect to fetch.
     */
    where?: AspectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Aspects to fetch.
     */
    orderBy?: AspectOrderByWithRelationInput | AspectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Aspects.
     */
    cursor?: AspectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Aspects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Aspects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Aspects.
     */
    distinct?: AspectScalarFieldEnum | AspectScalarFieldEnum[]
  }

  /**
   * Aspect findFirstOrThrow
   */
  export type AspectFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
    /**
     * Filter, which Aspect to fetch.
     */
    where?: AspectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Aspects to fetch.
     */
    orderBy?: AspectOrderByWithRelationInput | AspectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Aspects.
     */
    cursor?: AspectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Aspects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Aspects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Aspects.
     */
    distinct?: AspectScalarFieldEnum | AspectScalarFieldEnum[]
  }

  /**
   * Aspect findMany
   */
  export type AspectFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
    /**
     * Filter, which Aspects to fetch.
     */
    where?: AspectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Aspects to fetch.
     */
    orderBy?: AspectOrderByWithRelationInput | AspectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Aspects.
     */
    cursor?: AspectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Aspects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Aspects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Aspects.
     */
    distinct?: AspectScalarFieldEnum | AspectScalarFieldEnum[]
  }

  /**
   * Aspect create
   */
  export type AspectCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
    /**
     * The data needed to create a Aspect.
     */
    data: XOR<AspectCreateInput, AspectUncheckedCreateInput>
  }

  /**
   * Aspect createMany
   */
  export type AspectCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Aspects.
     */
    data: AspectCreateManyInput | AspectCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Aspect createManyAndReturn
   */
  export type AspectCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * The data used to create many Aspects.
     */
    data: AspectCreateManyInput | AspectCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Aspect update
   */
  export type AspectUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
    /**
     * The data needed to update a Aspect.
     */
    data: XOR<AspectUpdateInput, AspectUncheckedUpdateInput>
    /**
     * Choose, which Aspect to update.
     */
    where: AspectWhereUniqueInput
  }

  /**
   * Aspect updateMany
   */
  export type AspectUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Aspects.
     */
    data: XOR<AspectUpdateManyMutationInput, AspectUncheckedUpdateManyInput>
    /**
     * Filter which Aspects to update
     */
    where?: AspectWhereInput
    /**
     * Limit how many Aspects to update.
     */
    limit?: number
  }

  /**
   * Aspect updateManyAndReturn
   */
  export type AspectUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * The data used to update Aspects.
     */
    data: XOR<AspectUpdateManyMutationInput, AspectUncheckedUpdateManyInput>
    /**
     * Filter which Aspects to update
     */
    where?: AspectWhereInput
    /**
     * Limit how many Aspects to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Aspect upsert
   */
  export type AspectUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
    /**
     * The filter to search for the Aspect to update in case it exists.
     */
    where: AspectWhereUniqueInput
    /**
     * In case the Aspect found by the `where` argument doesn't exist, create a new Aspect with this data.
     */
    create: XOR<AspectCreateInput, AspectUncheckedCreateInput>
    /**
     * In case the Aspect was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AspectUpdateInput, AspectUncheckedUpdateInput>
  }

  /**
   * Aspect delete
   */
  export type AspectDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
    /**
     * Filter which Aspect to delete.
     */
    where: AspectWhereUniqueInput
  }

  /**
   * Aspect deleteMany
   */
  export type AspectDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Aspects to delete
     */
    where?: AspectWhereInput
    /**
     * Limit how many Aspects to delete.
     */
    limit?: number
  }

  /**
   * Aspect.indicators
   */
  export type Aspect$indicatorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
    where?: IndicatorWhereInput
    orderBy?: IndicatorOrderByWithRelationInput | IndicatorOrderByWithRelationInput[]
    cursor?: IndicatorWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IndicatorScalarFieldEnum | IndicatorScalarFieldEnum[]
  }

  /**
   * Aspect without action
   */
  export type AspectDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Aspect
     */
    select?: AspectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Aspect
     */
    omit?: AspectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AspectInclude<ExtArgs> | null
  }


  /**
   * Model Indicator
   */

  export type AggregateIndicator = {
    _count: IndicatorCountAggregateOutputType | null
    _avg: IndicatorAvgAggregateOutputType | null
    _sum: IndicatorSumAggregateOutputType | null
    _min: IndicatorMinAggregateOutputType | null
    _max: IndicatorMaxAggregateOutputType | null
  }

  export type IndicatorAvgAggregateOutputType = {
    weight: number | null
  }

  export type IndicatorSumAggregateOutputType = {
    weight: number | null
  }

  export type IndicatorMinAggregateOutputType = {
    id: string | null
    name: string | null
    weight: number | null
    aspectId: string | null
  }

  export type IndicatorMaxAggregateOutputType = {
    id: string | null
    name: string | null
    weight: number | null
    aspectId: string | null
  }

  export type IndicatorCountAggregateOutputType = {
    id: number
    name: number
    weight: number
    aspectId: number
    _all: number
  }


  export type IndicatorAvgAggregateInputType = {
    weight?: true
  }

  export type IndicatorSumAggregateInputType = {
    weight?: true
  }

  export type IndicatorMinAggregateInputType = {
    id?: true
    name?: true
    weight?: true
    aspectId?: true
  }

  export type IndicatorMaxAggregateInputType = {
    id?: true
    name?: true
    weight?: true
    aspectId?: true
  }

  export type IndicatorCountAggregateInputType = {
    id?: true
    name?: true
    weight?: true
    aspectId?: true
    _all?: true
  }

  export type IndicatorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Indicator to aggregate.
     */
    where?: IndicatorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Indicators to fetch.
     */
    orderBy?: IndicatorOrderByWithRelationInput | IndicatorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IndicatorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Indicators from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Indicators.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Indicators
    **/
    _count?: true | IndicatorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: IndicatorAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: IndicatorSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IndicatorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IndicatorMaxAggregateInputType
  }

  export type GetIndicatorAggregateType<T extends IndicatorAggregateArgs> = {
        [P in keyof T & keyof AggregateIndicator]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIndicator[P]>
      : GetScalarType<T[P], AggregateIndicator[P]>
  }




  export type IndicatorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IndicatorWhereInput
    orderBy?: IndicatorOrderByWithAggregationInput | IndicatorOrderByWithAggregationInput[]
    by: IndicatorScalarFieldEnum[] | IndicatorScalarFieldEnum
    having?: IndicatorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IndicatorCountAggregateInputType | true
    _avg?: IndicatorAvgAggregateInputType
    _sum?: IndicatorSumAggregateInputType
    _min?: IndicatorMinAggregateInputType
    _max?: IndicatorMaxAggregateInputType
  }

  export type IndicatorGroupByOutputType = {
    id: string
    name: string
    weight: number
    aspectId: string
    _count: IndicatorCountAggregateOutputType | null
    _avg: IndicatorAvgAggregateOutputType | null
    _sum: IndicatorSumAggregateOutputType | null
    _min: IndicatorMinAggregateOutputType | null
    _max: IndicatorMaxAggregateOutputType | null
  }

  type GetIndicatorGroupByPayload<T extends IndicatorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IndicatorGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IndicatorGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IndicatorGroupByOutputType[P]>
            : GetScalarType<T[P], IndicatorGroupByOutputType[P]>
        }
      >
    >


  export type IndicatorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    weight?: boolean
    aspectId?: boolean
    aspect?: boolean | AspectDefaultArgs<ExtArgs>
    activities?: boolean | Indicator$activitiesArgs<ExtArgs>
    _count?: boolean | IndicatorCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["indicator"]>

  export type IndicatorSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    weight?: boolean
    aspectId?: boolean
    aspect?: boolean | AspectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["indicator"]>

  export type IndicatorSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    weight?: boolean
    aspectId?: boolean
    aspect?: boolean | AspectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["indicator"]>

  export type IndicatorSelectScalar = {
    id?: boolean
    name?: boolean
    weight?: boolean
    aspectId?: boolean
  }

  export type IndicatorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "weight" | "aspectId", ExtArgs["result"]["indicator"]>
  export type IndicatorInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aspect?: boolean | AspectDefaultArgs<ExtArgs>
    activities?: boolean | Indicator$activitiesArgs<ExtArgs>
    _count?: boolean | IndicatorCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type IndicatorIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aspect?: boolean | AspectDefaultArgs<ExtArgs>
  }
  export type IndicatorIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aspect?: boolean | AspectDefaultArgs<ExtArgs>
  }

  export type $IndicatorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Indicator"
    objects: {
      aspect: Prisma.$AspectPayload<ExtArgs>
      activities: Prisma.$ActivityPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      weight: number
      aspectId: string
    }, ExtArgs["result"]["indicator"]>
    composites: {}
  }

  type IndicatorGetPayload<S extends boolean | null | undefined | IndicatorDefaultArgs> = $Result.GetResult<Prisma.$IndicatorPayload, S>

  type IndicatorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IndicatorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IndicatorCountAggregateInputType | true
    }

  export interface IndicatorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Indicator'], meta: { name: 'Indicator' } }
    /**
     * Find zero or one Indicator that matches the filter.
     * @param {IndicatorFindUniqueArgs} args - Arguments to find a Indicator
     * @example
     * // Get one Indicator
     * const indicator = await prisma.indicator.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IndicatorFindUniqueArgs>(args: SelectSubset<T, IndicatorFindUniqueArgs<ExtArgs>>): Prisma__IndicatorClient<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Indicator that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IndicatorFindUniqueOrThrowArgs} args - Arguments to find a Indicator
     * @example
     * // Get one Indicator
     * const indicator = await prisma.indicator.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IndicatorFindUniqueOrThrowArgs>(args: SelectSubset<T, IndicatorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IndicatorClient<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Indicator that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndicatorFindFirstArgs} args - Arguments to find a Indicator
     * @example
     * // Get one Indicator
     * const indicator = await prisma.indicator.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IndicatorFindFirstArgs>(args?: SelectSubset<T, IndicatorFindFirstArgs<ExtArgs>>): Prisma__IndicatorClient<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Indicator that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndicatorFindFirstOrThrowArgs} args - Arguments to find a Indicator
     * @example
     * // Get one Indicator
     * const indicator = await prisma.indicator.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IndicatorFindFirstOrThrowArgs>(args?: SelectSubset<T, IndicatorFindFirstOrThrowArgs<ExtArgs>>): Prisma__IndicatorClient<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Indicators that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndicatorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Indicators
     * const indicators = await prisma.indicator.findMany()
     * 
     * // Get first 10 Indicators
     * const indicators = await prisma.indicator.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const indicatorWithIdOnly = await prisma.indicator.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IndicatorFindManyArgs>(args?: SelectSubset<T, IndicatorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Indicator.
     * @param {IndicatorCreateArgs} args - Arguments to create a Indicator.
     * @example
     * // Create one Indicator
     * const Indicator = await prisma.indicator.create({
     *   data: {
     *     // ... data to create a Indicator
     *   }
     * })
     * 
     */
    create<T extends IndicatorCreateArgs>(args: SelectSubset<T, IndicatorCreateArgs<ExtArgs>>): Prisma__IndicatorClient<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Indicators.
     * @param {IndicatorCreateManyArgs} args - Arguments to create many Indicators.
     * @example
     * // Create many Indicators
     * const indicator = await prisma.indicator.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IndicatorCreateManyArgs>(args?: SelectSubset<T, IndicatorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Indicators and returns the data saved in the database.
     * @param {IndicatorCreateManyAndReturnArgs} args - Arguments to create many Indicators.
     * @example
     * // Create many Indicators
     * const indicator = await prisma.indicator.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Indicators and only return the `id`
     * const indicatorWithIdOnly = await prisma.indicator.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IndicatorCreateManyAndReturnArgs>(args?: SelectSubset<T, IndicatorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Indicator.
     * @param {IndicatorDeleteArgs} args - Arguments to delete one Indicator.
     * @example
     * // Delete one Indicator
     * const Indicator = await prisma.indicator.delete({
     *   where: {
     *     // ... filter to delete one Indicator
     *   }
     * })
     * 
     */
    delete<T extends IndicatorDeleteArgs>(args: SelectSubset<T, IndicatorDeleteArgs<ExtArgs>>): Prisma__IndicatorClient<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Indicator.
     * @param {IndicatorUpdateArgs} args - Arguments to update one Indicator.
     * @example
     * // Update one Indicator
     * const indicator = await prisma.indicator.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IndicatorUpdateArgs>(args: SelectSubset<T, IndicatorUpdateArgs<ExtArgs>>): Prisma__IndicatorClient<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Indicators.
     * @param {IndicatorDeleteManyArgs} args - Arguments to filter Indicators to delete.
     * @example
     * // Delete a few Indicators
     * const { count } = await prisma.indicator.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IndicatorDeleteManyArgs>(args?: SelectSubset<T, IndicatorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Indicators.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndicatorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Indicators
     * const indicator = await prisma.indicator.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IndicatorUpdateManyArgs>(args: SelectSubset<T, IndicatorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Indicators and returns the data updated in the database.
     * @param {IndicatorUpdateManyAndReturnArgs} args - Arguments to update many Indicators.
     * @example
     * // Update many Indicators
     * const indicator = await prisma.indicator.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Indicators and only return the `id`
     * const indicatorWithIdOnly = await prisma.indicator.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IndicatorUpdateManyAndReturnArgs>(args: SelectSubset<T, IndicatorUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Indicator.
     * @param {IndicatorUpsertArgs} args - Arguments to update or create a Indicator.
     * @example
     * // Update or create a Indicator
     * const indicator = await prisma.indicator.upsert({
     *   create: {
     *     // ... data to create a Indicator
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Indicator we want to update
     *   }
     * })
     */
    upsert<T extends IndicatorUpsertArgs>(args: SelectSubset<T, IndicatorUpsertArgs<ExtArgs>>): Prisma__IndicatorClient<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Indicators.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndicatorCountArgs} args - Arguments to filter Indicators to count.
     * @example
     * // Count the number of Indicators
     * const count = await prisma.indicator.count({
     *   where: {
     *     // ... the filter for the Indicators we want to count
     *   }
     * })
    **/
    count<T extends IndicatorCountArgs>(
      args?: Subset<T, IndicatorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IndicatorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Indicator.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndicatorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IndicatorAggregateArgs>(args: Subset<T, IndicatorAggregateArgs>): Prisma.PrismaPromise<GetIndicatorAggregateType<T>>

    /**
     * Group by Indicator.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndicatorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IndicatorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IndicatorGroupByArgs['orderBy'] }
        : { orderBy?: IndicatorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IndicatorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIndicatorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Indicator model
   */
  readonly fields: IndicatorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Indicator.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IndicatorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    aspect<T extends AspectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AspectDefaultArgs<ExtArgs>>): Prisma__AspectClient<$Result.GetResult<Prisma.$AspectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    activities<T extends Indicator$activitiesArgs<ExtArgs> = {}>(args?: Subset<T, Indicator$activitiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Indicator model
   */
  interface IndicatorFieldRefs {
    readonly id: FieldRef<"Indicator", 'String'>
    readonly name: FieldRef<"Indicator", 'String'>
    readonly weight: FieldRef<"Indicator", 'Float'>
    readonly aspectId: FieldRef<"Indicator", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Indicator findUnique
   */
  export type IndicatorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
    /**
     * Filter, which Indicator to fetch.
     */
    where: IndicatorWhereUniqueInput
  }

  /**
   * Indicator findUniqueOrThrow
   */
  export type IndicatorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
    /**
     * Filter, which Indicator to fetch.
     */
    where: IndicatorWhereUniqueInput
  }

  /**
   * Indicator findFirst
   */
  export type IndicatorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
    /**
     * Filter, which Indicator to fetch.
     */
    where?: IndicatorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Indicators to fetch.
     */
    orderBy?: IndicatorOrderByWithRelationInput | IndicatorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Indicators.
     */
    cursor?: IndicatorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Indicators from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Indicators.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Indicators.
     */
    distinct?: IndicatorScalarFieldEnum | IndicatorScalarFieldEnum[]
  }

  /**
   * Indicator findFirstOrThrow
   */
  export type IndicatorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
    /**
     * Filter, which Indicator to fetch.
     */
    where?: IndicatorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Indicators to fetch.
     */
    orderBy?: IndicatorOrderByWithRelationInput | IndicatorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Indicators.
     */
    cursor?: IndicatorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Indicators from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Indicators.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Indicators.
     */
    distinct?: IndicatorScalarFieldEnum | IndicatorScalarFieldEnum[]
  }

  /**
   * Indicator findMany
   */
  export type IndicatorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
    /**
     * Filter, which Indicators to fetch.
     */
    where?: IndicatorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Indicators to fetch.
     */
    orderBy?: IndicatorOrderByWithRelationInput | IndicatorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Indicators.
     */
    cursor?: IndicatorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Indicators from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Indicators.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Indicators.
     */
    distinct?: IndicatorScalarFieldEnum | IndicatorScalarFieldEnum[]
  }

  /**
   * Indicator create
   */
  export type IndicatorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
    /**
     * The data needed to create a Indicator.
     */
    data: XOR<IndicatorCreateInput, IndicatorUncheckedCreateInput>
  }

  /**
   * Indicator createMany
   */
  export type IndicatorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Indicators.
     */
    data: IndicatorCreateManyInput | IndicatorCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Indicator createManyAndReturn
   */
  export type IndicatorCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * The data used to create many Indicators.
     */
    data: IndicatorCreateManyInput | IndicatorCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Indicator update
   */
  export type IndicatorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
    /**
     * The data needed to update a Indicator.
     */
    data: XOR<IndicatorUpdateInput, IndicatorUncheckedUpdateInput>
    /**
     * Choose, which Indicator to update.
     */
    where: IndicatorWhereUniqueInput
  }

  /**
   * Indicator updateMany
   */
  export type IndicatorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Indicators.
     */
    data: XOR<IndicatorUpdateManyMutationInput, IndicatorUncheckedUpdateManyInput>
    /**
     * Filter which Indicators to update
     */
    where?: IndicatorWhereInput
    /**
     * Limit how many Indicators to update.
     */
    limit?: number
  }

  /**
   * Indicator updateManyAndReturn
   */
  export type IndicatorUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * The data used to update Indicators.
     */
    data: XOR<IndicatorUpdateManyMutationInput, IndicatorUncheckedUpdateManyInput>
    /**
     * Filter which Indicators to update
     */
    where?: IndicatorWhereInput
    /**
     * Limit how many Indicators to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Indicator upsert
   */
  export type IndicatorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
    /**
     * The filter to search for the Indicator to update in case it exists.
     */
    where: IndicatorWhereUniqueInput
    /**
     * In case the Indicator found by the `where` argument doesn't exist, create a new Indicator with this data.
     */
    create: XOR<IndicatorCreateInput, IndicatorUncheckedCreateInput>
    /**
     * In case the Indicator was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IndicatorUpdateInput, IndicatorUncheckedUpdateInput>
  }

  /**
   * Indicator delete
   */
  export type IndicatorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
    /**
     * Filter which Indicator to delete.
     */
    where: IndicatorWhereUniqueInput
  }

  /**
   * Indicator deleteMany
   */
  export type IndicatorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Indicators to delete
     */
    where?: IndicatorWhereInput
    /**
     * Limit how many Indicators to delete.
     */
    limit?: number
  }

  /**
   * Indicator.activities
   */
  export type Indicator$activitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    where?: ActivityWhereInput
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    cursor?: ActivityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ActivityScalarFieldEnum | ActivityScalarFieldEnum[]
  }

  /**
   * Indicator without action
   */
  export type IndicatorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Indicator
     */
    select?: IndicatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Indicator
     */
    omit?: IndicatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IndicatorInclude<ExtArgs> | null
  }


  /**
   * Model Activity
   */

  export type AggregateActivity = {
    _count: ActivityCountAggregateOutputType | null
    _avg: ActivityAvgAggregateOutputType | null
    _sum: ActivitySumAggregateOutputType | null
    _min: ActivityMinAggregateOutputType | null
    _max: ActivityMaxAggregateOutputType | null
  }

  export type ActivityAvgAggregateOutputType = {
    weight: number | null
    maxScore: number | null
  }

  export type ActivitySumAggregateOutputType = {
    weight: number | null
    maxScore: number | null
  }

  export type ActivityMinAggregateOutputType = {
    id: string | null
    name: string | null
    weight: number | null
    maxScore: number | null
    indicatorId: string | null
  }

  export type ActivityMaxAggregateOutputType = {
    id: string | null
    name: string | null
    weight: number | null
    maxScore: number | null
    indicatorId: string | null
  }

  export type ActivityCountAggregateOutputType = {
    id: number
    name: number
    weight: number
    maxScore: number
    indicatorId: number
    _all: number
  }


  export type ActivityAvgAggregateInputType = {
    weight?: true
    maxScore?: true
  }

  export type ActivitySumAggregateInputType = {
    weight?: true
    maxScore?: true
  }

  export type ActivityMinAggregateInputType = {
    id?: true
    name?: true
    weight?: true
    maxScore?: true
    indicatorId?: true
  }

  export type ActivityMaxAggregateInputType = {
    id?: true
    name?: true
    weight?: true
    maxScore?: true
    indicatorId?: true
  }

  export type ActivityCountAggregateInputType = {
    id?: true
    name?: true
    weight?: true
    maxScore?: true
    indicatorId?: true
    _all?: true
  }

  export type ActivityAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Activity to aggregate.
     */
    where?: ActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Activities to fetch.
     */
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Activities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Activities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Activities
    **/
    _count?: true | ActivityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ActivityAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ActivitySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ActivityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ActivityMaxAggregateInputType
  }

  export type GetActivityAggregateType<T extends ActivityAggregateArgs> = {
        [P in keyof T & keyof AggregateActivity]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateActivity[P]>
      : GetScalarType<T[P], AggregateActivity[P]>
  }




  export type ActivityGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ActivityWhereInput
    orderBy?: ActivityOrderByWithAggregationInput | ActivityOrderByWithAggregationInput[]
    by: ActivityScalarFieldEnum[] | ActivityScalarFieldEnum
    having?: ActivityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ActivityCountAggregateInputType | true
    _avg?: ActivityAvgAggregateInputType
    _sum?: ActivitySumAggregateInputType
    _min?: ActivityMinAggregateInputType
    _max?: ActivityMaxAggregateInputType
  }

  export type ActivityGroupByOutputType = {
    id: string
    name: string
    weight: number
    maxScore: number
    indicatorId: string
    _count: ActivityCountAggregateOutputType | null
    _avg: ActivityAvgAggregateOutputType | null
    _sum: ActivitySumAggregateOutputType | null
    _min: ActivityMinAggregateOutputType | null
    _max: ActivityMaxAggregateOutputType | null
  }

  type GetActivityGroupByPayload<T extends ActivityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ActivityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ActivityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ActivityGroupByOutputType[P]>
            : GetScalarType<T[P], ActivityGroupByOutputType[P]>
        }
      >
    >


  export type ActivitySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    weight?: boolean
    maxScore?: boolean
    indicatorId?: boolean
    indicator?: boolean | IndicatorDefaultArgs<ExtArgs>
    gradeEntries?: boolean | Activity$gradeEntriesArgs<ExtArgs>
    _count?: boolean | ActivityCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["activity"]>

  export type ActivitySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    weight?: boolean
    maxScore?: boolean
    indicatorId?: boolean
    indicator?: boolean | IndicatorDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["activity"]>

  export type ActivitySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    weight?: boolean
    maxScore?: boolean
    indicatorId?: boolean
    indicator?: boolean | IndicatorDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["activity"]>

  export type ActivitySelectScalar = {
    id?: boolean
    name?: boolean
    weight?: boolean
    maxScore?: boolean
    indicatorId?: boolean
  }

  export type ActivityOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "weight" | "maxScore" | "indicatorId", ExtArgs["result"]["activity"]>
  export type ActivityInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    indicator?: boolean | IndicatorDefaultArgs<ExtArgs>
    gradeEntries?: boolean | Activity$gradeEntriesArgs<ExtArgs>
    _count?: boolean | ActivityCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ActivityIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    indicator?: boolean | IndicatorDefaultArgs<ExtArgs>
  }
  export type ActivityIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    indicator?: boolean | IndicatorDefaultArgs<ExtArgs>
  }

  export type $ActivityPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Activity"
    objects: {
      indicator: Prisma.$IndicatorPayload<ExtArgs>
      gradeEntries: Prisma.$GradeEntryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      weight: number
      maxScore: number
      indicatorId: string
    }, ExtArgs["result"]["activity"]>
    composites: {}
  }

  type ActivityGetPayload<S extends boolean | null | undefined | ActivityDefaultArgs> = $Result.GetResult<Prisma.$ActivityPayload, S>

  type ActivityCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ActivityFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ActivityCountAggregateInputType | true
    }

  export interface ActivityDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Activity'], meta: { name: 'Activity' } }
    /**
     * Find zero or one Activity that matches the filter.
     * @param {ActivityFindUniqueArgs} args - Arguments to find a Activity
     * @example
     * // Get one Activity
     * const activity = await prisma.activity.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ActivityFindUniqueArgs>(args: SelectSubset<T, ActivityFindUniqueArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Activity that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ActivityFindUniqueOrThrowArgs} args - Arguments to find a Activity
     * @example
     * // Get one Activity
     * const activity = await prisma.activity.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ActivityFindUniqueOrThrowArgs>(args: SelectSubset<T, ActivityFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Activity that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityFindFirstArgs} args - Arguments to find a Activity
     * @example
     * // Get one Activity
     * const activity = await prisma.activity.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ActivityFindFirstArgs>(args?: SelectSubset<T, ActivityFindFirstArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Activity that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityFindFirstOrThrowArgs} args - Arguments to find a Activity
     * @example
     * // Get one Activity
     * const activity = await prisma.activity.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ActivityFindFirstOrThrowArgs>(args?: SelectSubset<T, ActivityFindFirstOrThrowArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Activities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Activities
     * const activities = await prisma.activity.findMany()
     * 
     * // Get first 10 Activities
     * const activities = await prisma.activity.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const activityWithIdOnly = await prisma.activity.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ActivityFindManyArgs>(args?: SelectSubset<T, ActivityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Activity.
     * @param {ActivityCreateArgs} args - Arguments to create a Activity.
     * @example
     * // Create one Activity
     * const Activity = await prisma.activity.create({
     *   data: {
     *     // ... data to create a Activity
     *   }
     * })
     * 
     */
    create<T extends ActivityCreateArgs>(args: SelectSubset<T, ActivityCreateArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Activities.
     * @param {ActivityCreateManyArgs} args - Arguments to create many Activities.
     * @example
     * // Create many Activities
     * const activity = await prisma.activity.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ActivityCreateManyArgs>(args?: SelectSubset<T, ActivityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Activities and returns the data saved in the database.
     * @param {ActivityCreateManyAndReturnArgs} args - Arguments to create many Activities.
     * @example
     * // Create many Activities
     * const activity = await prisma.activity.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Activities and only return the `id`
     * const activityWithIdOnly = await prisma.activity.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ActivityCreateManyAndReturnArgs>(args?: SelectSubset<T, ActivityCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Activity.
     * @param {ActivityDeleteArgs} args - Arguments to delete one Activity.
     * @example
     * // Delete one Activity
     * const Activity = await prisma.activity.delete({
     *   where: {
     *     // ... filter to delete one Activity
     *   }
     * })
     * 
     */
    delete<T extends ActivityDeleteArgs>(args: SelectSubset<T, ActivityDeleteArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Activity.
     * @param {ActivityUpdateArgs} args - Arguments to update one Activity.
     * @example
     * // Update one Activity
     * const activity = await prisma.activity.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ActivityUpdateArgs>(args: SelectSubset<T, ActivityUpdateArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Activities.
     * @param {ActivityDeleteManyArgs} args - Arguments to filter Activities to delete.
     * @example
     * // Delete a few Activities
     * const { count } = await prisma.activity.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ActivityDeleteManyArgs>(args?: SelectSubset<T, ActivityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Activities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Activities
     * const activity = await prisma.activity.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ActivityUpdateManyArgs>(args: SelectSubset<T, ActivityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Activities and returns the data updated in the database.
     * @param {ActivityUpdateManyAndReturnArgs} args - Arguments to update many Activities.
     * @example
     * // Update many Activities
     * const activity = await prisma.activity.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Activities and only return the `id`
     * const activityWithIdOnly = await prisma.activity.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ActivityUpdateManyAndReturnArgs>(args: SelectSubset<T, ActivityUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Activity.
     * @param {ActivityUpsertArgs} args - Arguments to update or create a Activity.
     * @example
     * // Update or create a Activity
     * const activity = await prisma.activity.upsert({
     *   create: {
     *     // ... data to create a Activity
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Activity we want to update
     *   }
     * })
     */
    upsert<T extends ActivityUpsertArgs>(args: SelectSubset<T, ActivityUpsertArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Activities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityCountArgs} args - Arguments to filter Activities to count.
     * @example
     * // Count the number of Activities
     * const count = await prisma.activity.count({
     *   where: {
     *     // ... the filter for the Activities we want to count
     *   }
     * })
    **/
    count<T extends ActivityCountArgs>(
      args?: Subset<T, ActivityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ActivityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Activity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ActivityAggregateArgs>(args: Subset<T, ActivityAggregateArgs>): Prisma.PrismaPromise<GetActivityAggregateType<T>>

    /**
     * Group by Activity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ActivityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ActivityGroupByArgs['orderBy'] }
        : { orderBy?: ActivityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ActivityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetActivityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Activity model
   */
  readonly fields: ActivityFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Activity.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ActivityClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    indicator<T extends IndicatorDefaultArgs<ExtArgs> = {}>(args?: Subset<T, IndicatorDefaultArgs<ExtArgs>>): Prisma__IndicatorClient<$Result.GetResult<Prisma.$IndicatorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    gradeEntries<T extends Activity$gradeEntriesArgs<ExtArgs> = {}>(args?: Subset<T, Activity$gradeEntriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Activity model
   */
  interface ActivityFieldRefs {
    readonly id: FieldRef<"Activity", 'String'>
    readonly name: FieldRef<"Activity", 'String'>
    readonly weight: FieldRef<"Activity", 'Float'>
    readonly maxScore: FieldRef<"Activity", 'Float'>
    readonly indicatorId: FieldRef<"Activity", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Activity findUnique
   */
  export type ActivityFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter, which Activity to fetch.
     */
    where: ActivityWhereUniqueInput
  }

  /**
   * Activity findUniqueOrThrow
   */
  export type ActivityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter, which Activity to fetch.
     */
    where: ActivityWhereUniqueInput
  }

  /**
   * Activity findFirst
   */
  export type ActivityFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter, which Activity to fetch.
     */
    where?: ActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Activities to fetch.
     */
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Activities.
     */
    cursor?: ActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Activities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Activities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Activities.
     */
    distinct?: ActivityScalarFieldEnum | ActivityScalarFieldEnum[]
  }

  /**
   * Activity findFirstOrThrow
   */
  export type ActivityFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter, which Activity to fetch.
     */
    where?: ActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Activities to fetch.
     */
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Activities.
     */
    cursor?: ActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Activities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Activities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Activities.
     */
    distinct?: ActivityScalarFieldEnum | ActivityScalarFieldEnum[]
  }

  /**
   * Activity findMany
   */
  export type ActivityFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter, which Activities to fetch.
     */
    where?: ActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Activities to fetch.
     */
    orderBy?: ActivityOrderByWithRelationInput | ActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Activities.
     */
    cursor?: ActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Activities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Activities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Activities.
     */
    distinct?: ActivityScalarFieldEnum | ActivityScalarFieldEnum[]
  }

  /**
   * Activity create
   */
  export type ActivityCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * The data needed to create a Activity.
     */
    data: XOR<ActivityCreateInput, ActivityUncheckedCreateInput>
  }

  /**
   * Activity createMany
   */
  export type ActivityCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Activities.
     */
    data: ActivityCreateManyInput | ActivityCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Activity createManyAndReturn
   */
  export type ActivityCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * The data used to create many Activities.
     */
    data: ActivityCreateManyInput | ActivityCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Activity update
   */
  export type ActivityUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * The data needed to update a Activity.
     */
    data: XOR<ActivityUpdateInput, ActivityUncheckedUpdateInput>
    /**
     * Choose, which Activity to update.
     */
    where: ActivityWhereUniqueInput
  }

  /**
   * Activity updateMany
   */
  export type ActivityUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Activities.
     */
    data: XOR<ActivityUpdateManyMutationInput, ActivityUncheckedUpdateManyInput>
    /**
     * Filter which Activities to update
     */
    where?: ActivityWhereInput
    /**
     * Limit how many Activities to update.
     */
    limit?: number
  }

  /**
   * Activity updateManyAndReturn
   */
  export type ActivityUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * The data used to update Activities.
     */
    data: XOR<ActivityUpdateManyMutationInput, ActivityUncheckedUpdateManyInput>
    /**
     * Filter which Activities to update
     */
    where?: ActivityWhereInput
    /**
     * Limit how many Activities to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Activity upsert
   */
  export type ActivityUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * The filter to search for the Activity to update in case it exists.
     */
    where: ActivityWhereUniqueInput
    /**
     * In case the Activity found by the `where` argument doesn't exist, create a new Activity with this data.
     */
    create: XOR<ActivityCreateInput, ActivityUncheckedCreateInput>
    /**
     * In case the Activity was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ActivityUpdateInput, ActivityUncheckedUpdateInput>
  }

  /**
   * Activity delete
   */
  export type ActivityDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
    /**
     * Filter which Activity to delete.
     */
    where: ActivityWhereUniqueInput
  }

  /**
   * Activity deleteMany
   */
  export type ActivityDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Activities to delete
     */
    where?: ActivityWhereInput
    /**
     * Limit how many Activities to delete.
     */
    limit?: number
  }

  /**
   * Activity.gradeEntries
   */
  export type Activity$gradeEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    where?: GradeEntryWhereInput
    orderBy?: GradeEntryOrderByWithRelationInput | GradeEntryOrderByWithRelationInput[]
    cursor?: GradeEntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GradeEntryScalarFieldEnum | GradeEntryScalarFieldEnum[]
  }

  /**
   * Activity without action
   */
  export type ActivityDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Activity
     */
    select?: ActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Activity
     */
    omit?: ActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActivityInclude<ExtArgs> | null
  }


  /**
   * Model GradeEntry
   */

  export type AggregateGradeEntry = {
    _count: GradeEntryCountAggregateOutputType | null
    _avg: GradeEntryAvgAggregateOutputType | null
    _sum: GradeEntrySumAggregateOutputType | null
    _min: GradeEntryMinAggregateOutputType | null
    _max: GradeEntryMaxAggregateOutputType | null
  }

  export type GradeEntryAvgAggregateOutputType = {
    score: number | null
  }

  export type GradeEntrySumAggregateOutputType = {
    score: number | null
  }

  export type GradeEntryMinAggregateOutputType = {
    id: string | null
    score: number | null
    feedback: string | null
    userId: string | null
    activityId: string | null
    periodId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type GradeEntryMaxAggregateOutputType = {
    id: string | null
    score: number | null
    feedback: string | null
    userId: string | null
    activityId: string | null
    periodId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type GradeEntryCountAggregateOutputType = {
    id: number
    score: number
    feedback: number
    userId: number
    activityId: number
    periodId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type GradeEntryAvgAggregateInputType = {
    score?: true
  }

  export type GradeEntrySumAggregateInputType = {
    score?: true
  }

  export type GradeEntryMinAggregateInputType = {
    id?: true
    score?: true
    feedback?: true
    userId?: true
    activityId?: true
    periodId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type GradeEntryMaxAggregateInputType = {
    id?: true
    score?: true
    feedback?: true
    userId?: true
    activityId?: true
    periodId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type GradeEntryCountAggregateInputType = {
    id?: true
    score?: true
    feedback?: true
    userId?: true
    activityId?: true
    periodId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type GradeEntryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GradeEntry to aggregate.
     */
    where?: GradeEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GradeEntries to fetch.
     */
    orderBy?: GradeEntryOrderByWithRelationInput | GradeEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GradeEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GradeEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GradeEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GradeEntries
    **/
    _count?: true | GradeEntryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GradeEntryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GradeEntrySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GradeEntryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GradeEntryMaxAggregateInputType
  }

  export type GetGradeEntryAggregateType<T extends GradeEntryAggregateArgs> = {
        [P in keyof T & keyof AggregateGradeEntry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGradeEntry[P]>
      : GetScalarType<T[P], AggregateGradeEntry[P]>
  }




  export type GradeEntryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GradeEntryWhereInput
    orderBy?: GradeEntryOrderByWithAggregationInput | GradeEntryOrderByWithAggregationInput[]
    by: GradeEntryScalarFieldEnum[] | GradeEntryScalarFieldEnum
    having?: GradeEntryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GradeEntryCountAggregateInputType | true
    _avg?: GradeEntryAvgAggregateInputType
    _sum?: GradeEntrySumAggregateInputType
    _min?: GradeEntryMinAggregateInputType
    _max?: GradeEntryMaxAggregateInputType
  }

  export type GradeEntryGroupByOutputType = {
    id: string
    score: number
    feedback: string | null
    userId: string
    activityId: string
    periodId: string
    createdAt: Date
    updatedAt: Date
    _count: GradeEntryCountAggregateOutputType | null
    _avg: GradeEntryAvgAggregateOutputType | null
    _sum: GradeEntrySumAggregateOutputType | null
    _min: GradeEntryMinAggregateOutputType | null
    _max: GradeEntryMaxAggregateOutputType | null
  }

  type GetGradeEntryGroupByPayload<T extends GradeEntryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GradeEntryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GradeEntryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GradeEntryGroupByOutputType[P]>
            : GetScalarType<T[P], GradeEntryGroupByOutputType[P]>
        }
      >
    >


  export type GradeEntrySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    score?: boolean
    feedback?: boolean
    userId?: boolean
    activityId?: boolean
    periodId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    activity?: boolean | ActivityDefaultArgs<ExtArgs>
    period?: boolean | PeriodDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gradeEntry"]>

  export type GradeEntrySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    score?: boolean
    feedback?: boolean
    userId?: boolean
    activityId?: boolean
    periodId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    activity?: boolean | ActivityDefaultArgs<ExtArgs>
    period?: boolean | PeriodDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gradeEntry"]>

  export type GradeEntrySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    score?: boolean
    feedback?: boolean
    userId?: boolean
    activityId?: boolean
    periodId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    activity?: boolean | ActivityDefaultArgs<ExtArgs>
    period?: boolean | PeriodDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gradeEntry"]>

  export type GradeEntrySelectScalar = {
    id?: boolean
    score?: boolean
    feedback?: boolean
    userId?: boolean
    activityId?: boolean
    periodId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type GradeEntryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "score" | "feedback" | "userId" | "activityId" | "periodId" | "createdAt" | "updatedAt", ExtArgs["result"]["gradeEntry"]>
  export type GradeEntryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    activity?: boolean | ActivityDefaultArgs<ExtArgs>
    period?: boolean | PeriodDefaultArgs<ExtArgs>
  }
  export type GradeEntryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    activity?: boolean | ActivityDefaultArgs<ExtArgs>
    period?: boolean | PeriodDefaultArgs<ExtArgs>
  }
  export type GradeEntryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    activity?: boolean | ActivityDefaultArgs<ExtArgs>
    period?: boolean | PeriodDefaultArgs<ExtArgs>
  }

  export type $GradeEntryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GradeEntry"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      activity: Prisma.$ActivityPayload<ExtArgs>
      period: Prisma.$PeriodPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      score: number
      feedback: string | null
      userId: string
      activityId: string
      periodId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["gradeEntry"]>
    composites: {}
  }

  type GradeEntryGetPayload<S extends boolean | null | undefined | GradeEntryDefaultArgs> = $Result.GetResult<Prisma.$GradeEntryPayload, S>

  type GradeEntryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GradeEntryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GradeEntryCountAggregateInputType | true
    }

  export interface GradeEntryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GradeEntry'], meta: { name: 'GradeEntry' } }
    /**
     * Find zero or one GradeEntry that matches the filter.
     * @param {GradeEntryFindUniqueArgs} args - Arguments to find a GradeEntry
     * @example
     * // Get one GradeEntry
     * const gradeEntry = await prisma.gradeEntry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GradeEntryFindUniqueArgs>(args: SelectSubset<T, GradeEntryFindUniqueArgs<ExtArgs>>): Prisma__GradeEntryClient<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GradeEntry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GradeEntryFindUniqueOrThrowArgs} args - Arguments to find a GradeEntry
     * @example
     * // Get one GradeEntry
     * const gradeEntry = await prisma.gradeEntry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GradeEntryFindUniqueOrThrowArgs>(args: SelectSubset<T, GradeEntryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GradeEntryClient<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GradeEntry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradeEntryFindFirstArgs} args - Arguments to find a GradeEntry
     * @example
     * // Get one GradeEntry
     * const gradeEntry = await prisma.gradeEntry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GradeEntryFindFirstArgs>(args?: SelectSubset<T, GradeEntryFindFirstArgs<ExtArgs>>): Prisma__GradeEntryClient<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GradeEntry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradeEntryFindFirstOrThrowArgs} args - Arguments to find a GradeEntry
     * @example
     * // Get one GradeEntry
     * const gradeEntry = await prisma.gradeEntry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GradeEntryFindFirstOrThrowArgs>(args?: SelectSubset<T, GradeEntryFindFirstOrThrowArgs<ExtArgs>>): Prisma__GradeEntryClient<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GradeEntries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradeEntryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GradeEntries
     * const gradeEntries = await prisma.gradeEntry.findMany()
     * 
     * // Get first 10 GradeEntries
     * const gradeEntries = await prisma.gradeEntry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const gradeEntryWithIdOnly = await prisma.gradeEntry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GradeEntryFindManyArgs>(args?: SelectSubset<T, GradeEntryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GradeEntry.
     * @param {GradeEntryCreateArgs} args - Arguments to create a GradeEntry.
     * @example
     * // Create one GradeEntry
     * const GradeEntry = await prisma.gradeEntry.create({
     *   data: {
     *     // ... data to create a GradeEntry
     *   }
     * })
     * 
     */
    create<T extends GradeEntryCreateArgs>(args: SelectSubset<T, GradeEntryCreateArgs<ExtArgs>>): Prisma__GradeEntryClient<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GradeEntries.
     * @param {GradeEntryCreateManyArgs} args - Arguments to create many GradeEntries.
     * @example
     * // Create many GradeEntries
     * const gradeEntry = await prisma.gradeEntry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GradeEntryCreateManyArgs>(args?: SelectSubset<T, GradeEntryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GradeEntries and returns the data saved in the database.
     * @param {GradeEntryCreateManyAndReturnArgs} args - Arguments to create many GradeEntries.
     * @example
     * // Create many GradeEntries
     * const gradeEntry = await prisma.gradeEntry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GradeEntries and only return the `id`
     * const gradeEntryWithIdOnly = await prisma.gradeEntry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GradeEntryCreateManyAndReturnArgs>(args?: SelectSubset<T, GradeEntryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GradeEntry.
     * @param {GradeEntryDeleteArgs} args - Arguments to delete one GradeEntry.
     * @example
     * // Delete one GradeEntry
     * const GradeEntry = await prisma.gradeEntry.delete({
     *   where: {
     *     // ... filter to delete one GradeEntry
     *   }
     * })
     * 
     */
    delete<T extends GradeEntryDeleteArgs>(args: SelectSubset<T, GradeEntryDeleteArgs<ExtArgs>>): Prisma__GradeEntryClient<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GradeEntry.
     * @param {GradeEntryUpdateArgs} args - Arguments to update one GradeEntry.
     * @example
     * // Update one GradeEntry
     * const gradeEntry = await prisma.gradeEntry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GradeEntryUpdateArgs>(args: SelectSubset<T, GradeEntryUpdateArgs<ExtArgs>>): Prisma__GradeEntryClient<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GradeEntries.
     * @param {GradeEntryDeleteManyArgs} args - Arguments to filter GradeEntries to delete.
     * @example
     * // Delete a few GradeEntries
     * const { count } = await prisma.gradeEntry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GradeEntryDeleteManyArgs>(args?: SelectSubset<T, GradeEntryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GradeEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradeEntryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GradeEntries
     * const gradeEntry = await prisma.gradeEntry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GradeEntryUpdateManyArgs>(args: SelectSubset<T, GradeEntryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GradeEntries and returns the data updated in the database.
     * @param {GradeEntryUpdateManyAndReturnArgs} args - Arguments to update many GradeEntries.
     * @example
     * // Update many GradeEntries
     * const gradeEntry = await prisma.gradeEntry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GradeEntries and only return the `id`
     * const gradeEntryWithIdOnly = await prisma.gradeEntry.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GradeEntryUpdateManyAndReturnArgs>(args: SelectSubset<T, GradeEntryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GradeEntry.
     * @param {GradeEntryUpsertArgs} args - Arguments to update or create a GradeEntry.
     * @example
     * // Update or create a GradeEntry
     * const gradeEntry = await prisma.gradeEntry.upsert({
     *   create: {
     *     // ... data to create a GradeEntry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GradeEntry we want to update
     *   }
     * })
     */
    upsert<T extends GradeEntryUpsertArgs>(args: SelectSubset<T, GradeEntryUpsertArgs<ExtArgs>>): Prisma__GradeEntryClient<$Result.GetResult<Prisma.$GradeEntryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GradeEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradeEntryCountArgs} args - Arguments to filter GradeEntries to count.
     * @example
     * // Count the number of GradeEntries
     * const count = await prisma.gradeEntry.count({
     *   where: {
     *     // ... the filter for the GradeEntries we want to count
     *   }
     * })
    **/
    count<T extends GradeEntryCountArgs>(
      args?: Subset<T, GradeEntryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GradeEntryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GradeEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradeEntryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GradeEntryAggregateArgs>(args: Subset<T, GradeEntryAggregateArgs>): Prisma.PrismaPromise<GetGradeEntryAggregateType<T>>

    /**
     * Group by GradeEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GradeEntryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GradeEntryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GradeEntryGroupByArgs['orderBy'] }
        : { orderBy?: GradeEntryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GradeEntryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGradeEntryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GradeEntry model
   */
  readonly fields: GradeEntryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GradeEntry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GradeEntryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    activity<T extends ActivityDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ActivityDefaultArgs<ExtArgs>>): Prisma__ActivityClient<$Result.GetResult<Prisma.$ActivityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    period<T extends PeriodDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PeriodDefaultArgs<ExtArgs>>): Prisma__PeriodClient<$Result.GetResult<Prisma.$PeriodPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the GradeEntry model
   */
  interface GradeEntryFieldRefs {
    readonly id: FieldRef<"GradeEntry", 'String'>
    readonly score: FieldRef<"GradeEntry", 'Float'>
    readonly feedback: FieldRef<"GradeEntry", 'String'>
    readonly userId: FieldRef<"GradeEntry", 'String'>
    readonly activityId: FieldRef<"GradeEntry", 'String'>
    readonly periodId: FieldRef<"GradeEntry", 'String'>
    readonly createdAt: FieldRef<"GradeEntry", 'DateTime'>
    readonly updatedAt: FieldRef<"GradeEntry", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * GradeEntry findUnique
   */
  export type GradeEntryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    /**
     * Filter, which GradeEntry to fetch.
     */
    where: GradeEntryWhereUniqueInput
  }

  /**
   * GradeEntry findUniqueOrThrow
   */
  export type GradeEntryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    /**
     * Filter, which GradeEntry to fetch.
     */
    where: GradeEntryWhereUniqueInput
  }

  /**
   * GradeEntry findFirst
   */
  export type GradeEntryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    /**
     * Filter, which GradeEntry to fetch.
     */
    where?: GradeEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GradeEntries to fetch.
     */
    orderBy?: GradeEntryOrderByWithRelationInput | GradeEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GradeEntries.
     */
    cursor?: GradeEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GradeEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GradeEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GradeEntries.
     */
    distinct?: GradeEntryScalarFieldEnum | GradeEntryScalarFieldEnum[]
  }

  /**
   * GradeEntry findFirstOrThrow
   */
  export type GradeEntryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    /**
     * Filter, which GradeEntry to fetch.
     */
    where?: GradeEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GradeEntries to fetch.
     */
    orderBy?: GradeEntryOrderByWithRelationInput | GradeEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GradeEntries.
     */
    cursor?: GradeEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GradeEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GradeEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GradeEntries.
     */
    distinct?: GradeEntryScalarFieldEnum | GradeEntryScalarFieldEnum[]
  }

  /**
   * GradeEntry findMany
   */
  export type GradeEntryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    /**
     * Filter, which GradeEntries to fetch.
     */
    where?: GradeEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GradeEntries to fetch.
     */
    orderBy?: GradeEntryOrderByWithRelationInput | GradeEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GradeEntries.
     */
    cursor?: GradeEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GradeEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GradeEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GradeEntries.
     */
    distinct?: GradeEntryScalarFieldEnum | GradeEntryScalarFieldEnum[]
  }

  /**
   * GradeEntry create
   */
  export type GradeEntryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    /**
     * The data needed to create a GradeEntry.
     */
    data: XOR<GradeEntryCreateInput, GradeEntryUncheckedCreateInput>
  }

  /**
   * GradeEntry createMany
   */
  export type GradeEntryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GradeEntries.
     */
    data: GradeEntryCreateManyInput | GradeEntryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * GradeEntry createManyAndReturn
   */
  export type GradeEntryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * The data used to create many GradeEntries.
     */
    data: GradeEntryCreateManyInput | GradeEntryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * GradeEntry update
   */
  export type GradeEntryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    /**
     * The data needed to update a GradeEntry.
     */
    data: XOR<GradeEntryUpdateInput, GradeEntryUncheckedUpdateInput>
    /**
     * Choose, which GradeEntry to update.
     */
    where: GradeEntryWhereUniqueInput
  }

  /**
   * GradeEntry updateMany
   */
  export type GradeEntryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GradeEntries.
     */
    data: XOR<GradeEntryUpdateManyMutationInput, GradeEntryUncheckedUpdateManyInput>
    /**
     * Filter which GradeEntries to update
     */
    where?: GradeEntryWhereInput
    /**
     * Limit how many GradeEntries to update.
     */
    limit?: number
  }

  /**
   * GradeEntry updateManyAndReturn
   */
  export type GradeEntryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * The data used to update GradeEntries.
     */
    data: XOR<GradeEntryUpdateManyMutationInput, GradeEntryUncheckedUpdateManyInput>
    /**
     * Filter which GradeEntries to update
     */
    where?: GradeEntryWhereInput
    /**
     * Limit how many GradeEntries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * GradeEntry upsert
   */
  export type GradeEntryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    /**
     * The filter to search for the GradeEntry to update in case it exists.
     */
    where: GradeEntryWhereUniqueInput
    /**
     * In case the GradeEntry found by the `where` argument doesn't exist, create a new GradeEntry with this data.
     */
    create: XOR<GradeEntryCreateInput, GradeEntryUncheckedCreateInput>
    /**
     * In case the GradeEntry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GradeEntryUpdateInput, GradeEntryUncheckedUpdateInput>
  }

  /**
   * GradeEntry delete
   */
  export type GradeEntryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
    /**
     * Filter which GradeEntry to delete.
     */
    where: GradeEntryWhereUniqueInput
  }

  /**
   * GradeEntry deleteMany
   */
  export type GradeEntryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GradeEntries to delete
     */
    where?: GradeEntryWhereInput
    /**
     * Limit how many GradeEntries to delete.
     */
    limit?: number
  }

  /**
   * GradeEntry without action
   */
  export type GradeEntryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GradeEntry
     */
    select?: GradeEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the GradeEntry
     */
    omit?: GradeEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GradeEntryInclude<ExtArgs> | null
  }


  /**
   * Model SelfEvaluation
   */

  export type AggregateSelfEvaluation = {
    _count: SelfEvaluationCountAggregateOutputType | null
    _avg: SelfEvaluationAvgAggregateOutputType | null
    _sum: SelfEvaluationSumAggregateOutputType | null
    _min: SelfEvaluationMinAggregateOutputType | null
    _max: SelfEvaluationMaxAggregateOutputType | null
  }

  export type SelfEvaluationAvgAggregateOutputType = {
    score: number | null
  }

  export type SelfEvaluationSumAggregateOutputType = {
    score: number | null
  }

  export type SelfEvaluationMinAggregateOutputType = {
    id: string | null
    score: number | null
    feedback: string | null
    userId: string | null
    courseId: string | null
    periodId: string | null
    createdAt: Date | null
  }

  export type SelfEvaluationMaxAggregateOutputType = {
    id: string | null
    score: number | null
    feedback: string | null
    userId: string | null
    courseId: string | null
    periodId: string | null
    createdAt: Date | null
  }

  export type SelfEvaluationCountAggregateOutputType = {
    id: number
    score: number
    feedback: number
    userId: number
    courseId: number
    periodId: number
    createdAt: number
    _all: number
  }


  export type SelfEvaluationAvgAggregateInputType = {
    score?: true
  }

  export type SelfEvaluationSumAggregateInputType = {
    score?: true
  }

  export type SelfEvaluationMinAggregateInputType = {
    id?: true
    score?: true
    feedback?: true
    userId?: true
    courseId?: true
    periodId?: true
    createdAt?: true
  }

  export type SelfEvaluationMaxAggregateInputType = {
    id?: true
    score?: true
    feedback?: true
    userId?: true
    courseId?: true
    periodId?: true
    createdAt?: true
  }

  export type SelfEvaluationCountAggregateInputType = {
    id?: true
    score?: true
    feedback?: true
    userId?: true
    courseId?: true
    periodId?: true
    createdAt?: true
    _all?: true
  }

  export type SelfEvaluationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SelfEvaluation to aggregate.
     */
    where?: SelfEvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SelfEvaluations to fetch.
     */
    orderBy?: SelfEvaluationOrderByWithRelationInput | SelfEvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SelfEvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SelfEvaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SelfEvaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SelfEvaluations
    **/
    _count?: true | SelfEvaluationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SelfEvaluationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SelfEvaluationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SelfEvaluationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SelfEvaluationMaxAggregateInputType
  }

  export type GetSelfEvaluationAggregateType<T extends SelfEvaluationAggregateArgs> = {
        [P in keyof T & keyof AggregateSelfEvaluation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSelfEvaluation[P]>
      : GetScalarType<T[P], AggregateSelfEvaluation[P]>
  }




  export type SelfEvaluationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SelfEvaluationWhereInput
    orderBy?: SelfEvaluationOrderByWithAggregationInput | SelfEvaluationOrderByWithAggregationInput[]
    by: SelfEvaluationScalarFieldEnum[] | SelfEvaluationScalarFieldEnum
    having?: SelfEvaluationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SelfEvaluationCountAggregateInputType | true
    _avg?: SelfEvaluationAvgAggregateInputType
    _sum?: SelfEvaluationSumAggregateInputType
    _min?: SelfEvaluationMinAggregateInputType
    _max?: SelfEvaluationMaxAggregateInputType
  }

  export type SelfEvaluationGroupByOutputType = {
    id: string
    score: number
    feedback: string | null
    userId: string
    courseId: string
    periodId: string
    createdAt: Date
    _count: SelfEvaluationCountAggregateOutputType | null
    _avg: SelfEvaluationAvgAggregateOutputType | null
    _sum: SelfEvaluationSumAggregateOutputType | null
    _min: SelfEvaluationMinAggregateOutputType | null
    _max: SelfEvaluationMaxAggregateOutputType | null
  }

  type GetSelfEvaluationGroupByPayload<T extends SelfEvaluationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SelfEvaluationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SelfEvaluationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SelfEvaluationGroupByOutputType[P]>
            : GetScalarType<T[P], SelfEvaluationGroupByOutputType[P]>
        }
      >
    >


  export type SelfEvaluationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    score?: boolean
    feedback?: boolean
    userId?: boolean
    courseId?: boolean
    periodId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["selfEvaluation"]>

  export type SelfEvaluationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    score?: boolean
    feedback?: boolean
    userId?: boolean
    courseId?: boolean
    periodId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["selfEvaluation"]>

  export type SelfEvaluationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    score?: boolean
    feedback?: boolean
    userId?: boolean
    courseId?: boolean
    periodId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["selfEvaluation"]>

  export type SelfEvaluationSelectScalar = {
    id?: boolean
    score?: boolean
    feedback?: boolean
    userId?: boolean
    courseId?: boolean
    periodId?: boolean
    createdAt?: boolean
  }

  export type SelfEvaluationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "score" | "feedback" | "userId" | "courseId" | "periodId" | "createdAt", ExtArgs["result"]["selfEvaluation"]>
  export type SelfEvaluationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SelfEvaluationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SelfEvaluationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SelfEvaluationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SelfEvaluation"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      score: number
      feedback: string | null
      userId: string
      courseId: string
      periodId: string
      createdAt: Date
    }, ExtArgs["result"]["selfEvaluation"]>
    composites: {}
  }

  type SelfEvaluationGetPayload<S extends boolean | null | undefined | SelfEvaluationDefaultArgs> = $Result.GetResult<Prisma.$SelfEvaluationPayload, S>

  type SelfEvaluationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SelfEvaluationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SelfEvaluationCountAggregateInputType | true
    }

  export interface SelfEvaluationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SelfEvaluation'], meta: { name: 'SelfEvaluation' } }
    /**
     * Find zero or one SelfEvaluation that matches the filter.
     * @param {SelfEvaluationFindUniqueArgs} args - Arguments to find a SelfEvaluation
     * @example
     * // Get one SelfEvaluation
     * const selfEvaluation = await prisma.selfEvaluation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SelfEvaluationFindUniqueArgs>(args: SelectSubset<T, SelfEvaluationFindUniqueArgs<ExtArgs>>): Prisma__SelfEvaluationClient<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SelfEvaluation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SelfEvaluationFindUniqueOrThrowArgs} args - Arguments to find a SelfEvaluation
     * @example
     * // Get one SelfEvaluation
     * const selfEvaluation = await prisma.selfEvaluation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SelfEvaluationFindUniqueOrThrowArgs>(args: SelectSubset<T, SelfEvaluationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SelfEvaluationClient<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SelfEvaluation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SelfEvaluationFindFirstArgs} args - Arguments to find a SelfEvaluation
     * @example
     * // Get one SelfEvaluation
     * const selfEvaluation = await prisma.selfEvaluation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SelfEvaluationFindFirstArgs>(args?: SelectSubset<T, SelfEvaluationFindFirstArgs<ExtArgs>>): Prisma__SelfEvaluationClient<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SelfEvaluation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SelfEvaluationFindFirstOrThrowArgs} args - Arguments to find a SelfEvaluation
     * @example
     * // Get one SelfEvaluation
     * const selfEvaluation = await prisma.selfEvaluation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SelfEvaluationFindFirstOrThrowArgs>(args?: SelectSubset<T, SelfEvaluationFindFirstOrThrowArgs<ExtArgs>>): Prisma__SelfEvaluationClient<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SelfEvaluations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SelfEvaluationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SelfEvaluations
     * const selfEvaluations = await prisma.selfEvaluation.findMany()
     * 
     * // Get first 10 SelfEvaluations
     * const selfEvaluations = await prisma.selfEvaluation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const selfEvaluationWithIdOnly = await prisma.selfEvaluation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SelfEvaluationFindManyArgs>(args?: SelectSubset<T, SelfEvaluationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SelfEvaluation.
     * @param {SelfEvaluationCreateArgs} args - Arguments to create a SelfEvaluation.
     * @example
     * // Create one SelfEvaluation
     * const SelfEvaluation = await prisma.selfEvaluation.create({
     *   data: {
     *     // ... data to create a SelfEvaluation
     *   }
     * })
     * 
     */
    create<T extends SelfEvaluationCreateArgs>(args: SelectSubset<T, SelfEvaluationCreateArgs<ExtArgs>>): Prisma__SelfEvaluationClient<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SelfEvaluations.
     * @param {SelfEvaluationCreateManyArgs} args - Arguments to create many SelfEvaluations.
     * @example
     * // Create many SelfEvaluations
     * const selfEvaluation = await prisma.selfEvaluation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SelfEvaluationCreateManyArgs>(args?: SelectSubset<T, SelfEvaluationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SelfEvaluations and returns the data saved in the database.
     * @param {SelfEvaluationCreateManyAndReturnArgs} args - Arguments to create many SelfEvaluations.
     * @example
     * // Create many SelfEvaluations
     * const selfEvaluation = await prisma.selfEvaluation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SelfEvaluations and only return the `id`
     * const selfEvaluationWithIdOnly = await prisma.selfEvaluation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SelfEvaluationCreateManyAndReturnArgs>(args?: SelectSubset<T, SelfEvaluationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SelfEvaluation.
     * @param {SelfEvaluationDeleteArgs} args - Arguments to delete one SelfEvaluation.
     * @example
     * // Delete one SelfEvaluation
     * const SelfEvaluation = await prisma.selfEvaluation.delete({
     *   where: {
     *     // ... filter to delete one SelfEvaluation
     *   }
     * })
     * 
     */
    delete<T extends SelfEvaluationDeleteArgs>(args: SelectSubset<T, SelfEvaluationDeleteArgs<ExtArgs>>): Prisma__SelfEvaluationClient<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SelfEvaluation.
     * @param {SelfEvaluationUpdateArgs} args - Arguments to update one SelfEvaluation.
     * @example
     * // Update one SelfEvaluation
     * const selfEvaluation = await prisma.selfEvaluation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SelfEvaluationUpdateArgs>(args: SelectSubset<T, SelfEvaluationUpdateArgs<ExtArgs>>): Prisma__SelfEvaluationClient<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SelfEvaluations.
     * @param {SelfEvaluationDeleteManyArgs} args - Arguments to filter SelfEvaluations to delete.
     * @example
     * // Delete a few SelfEvaluations
     * const { count } = await prisma.selfEvaluation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SelfEvaluationDeleteManyArgs>(args?: SelectSubset<T, SelfEvaluationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SelfEvaluations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SelfEvaluationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SelfEvaluations
     * const selfEvaluation = await prisma.selfEvaluation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SelfEvaluationUpdateManyArgs>(args: SelectSubset<T, SelfEvaluationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SelfEvaluations and returns the data updated in the database.
     * @param {SelfEvaluationUpdateManyAndReturnArgs} args - Arguments to update many SelfEvaluations.
     * @example
     * // Update many SelfEvaluations
     * const selfEvaluation = await prisma.selfEvaluation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SelfEvaluations and only return the `id`
     * const selfEvaluationWithIdOnly = await prisma.selfEvaluation.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SelfEvaluationUpdateManyAndReturnArgs>(args: SelectSubset<T, SelfEvaluationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SelfEvaluation.
     * @param {SelfEvaluationUpsertArgs} args - Arguments to update or create a SelfEvaluation.
     * @example
     * // Update or create a SelfEvaluation
     * const selfEvaluation = await prisma.selfEvaluation.upsert({
     *   create: {
     *     // ... data to create a SelfEvaluation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SelfEvaluation we want to update
     *   }
     * })
     */
    upsert<T extends SelfEvaluationUpsertArgs>(args: SelectSubset<T, SelfEvaluationUpsertArgs<ExtArgs>>): Prisma__SelfEvaluationClient<$Result.GetResult<Prisma.$SelfEvaluationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SelfEvaluations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SelfEvaluationCountArgs} args - Arguments to filter SelfEvaluations to count.
     * @example
     * // Count the number of SelfEvaluations
     * const count = await prisma.selfEvaluation.count({
     *   where: {
     *     // ... the filter for the SelfEvaluations we want to count
     *   }
     * })
    **/
    count<T extends SelfEvaluationCountArgs>(
      args?: Subset<T, SelfEvaluationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SelfEvaluationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SelfEvaluation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SelfEvaluationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SelfEvaluationAggregateArgs>(args: Subset<T, SelfEvaluationAggregateArgs>): Prisma.PrismaPromise<GetSelfEvaluationAggregateType<T>>

    /**
     * Group by SelfEvaluation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SelfEvaluationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SelfEvaluationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SelfEvaluationGroupByArgs['orderBy'] }
        : { orderBy?: SelfEvaluationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SelfEvaluationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSelfEvaluationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SelfEvaluation model
   */
  readonly fields: SelfEvaluationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SelfEvaluation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SelfEvaluationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SelfEvaluation model
   */
  interface SelfEvaluationFieldRefs {
    readonly id: FieldRef<"SelfEvaluation", 'String'>
    readonly score: FieldRef<"SelfEvaluation", 'Float'>
    readonly feedback: FieldRef<"SelfEvaluation", 'String'>
    readonly userId: FieldRef<"SelfEvaluation", 'String'>
    readonly courseId: FieldRef<"SelfEvaluation", 'String'>
    readonly periodId: FieldRef<"SelfEvaluation", 'String'>
    readonly createdAt: FieldRef<"SelfEvaluation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SelfEvaluation findUnique
   */
  export type SelfEvaluationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
    /**
     * Filter, which SelfEvaluation to fetch.
     */
    where: SelfEvaluationWhereUniqueInput
  }

  /**
   * SelfEvaluation findUniqueOrThrow
   */
  export type SelfEvaluationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
    /**
     * Filter, which SelfEvaluation to fetch.
     */
    where: SelfEvaluationWhereUniqueInput
  }

  /**
   * SelfEvaluation findFirst
   */
  export type SelfEvaluationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
    /**
     * Filter, which SelfEvaluation to fetch.
     */
    where?: SelfEvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SelfEvaluations to fetch.
     */
    orderBy?: SelfEvaluationOrderByWithRelationInput | SelfEvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SelfEvaluations.
     */
    cursor?: SelfEvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SelfEvaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SelfEvaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SelfEvaluations.
     */
    distinct?: SelfEvaluationScalarFieldEnum | SelfEvaluationScalarFieldEnum[]
  }

  /**
   * SelfEvaluation findFirstOrThrow
   */
  export type SelfEvaluationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
    /**
     * Filter, which SelfEvaluation to fetch.
     */
    where?: SelfEvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SelfEvaluations to fetch.
     */
    orderBy?: SelfEvaluationOrderByWithRelationInput | SelfEvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SelfEvaluations.
     */
    cursor?: SelfEvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SelfEvaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SelfEvaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SelfEvaluations.
     */
    distinct?: SelfEvaluationScalarFieldEnum | SelfEvaluationScalarFieldEnum[]
  }

  /**
   * SelfEvaluation findMany
   */
  export type SelfEvaluationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
    /**
     * Filter, which SelfEvaluations to fetch.
     */
    where?: SelfEvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SelfEvaluations to fetch.
     */
    orderBy?: SelfEvaluationOrderByWithRelationInput | SelfEvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SelfEvaluations.
     */
    cursor?: SelfEvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SelfEvaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SelfEvaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SelfEvaluations.
     */
    distinct?: SelfEvaluationScalarFieldEnum | SelfEvaluationScalarFieldEnum[]
  }

  /**
   * SelfEvaluation create
   */
  export type SelfEvaluationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
    /**
     * The data needed to create a SelfEvaluation.
     */
    data: XOR<SelfEvaluationCreateInput, SelfEvaluationUncheckedCreateInput>
  }

  /**
   * SelfEvaluation createMany
   */
  export type SelfEvaluationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SelfEvaluations.
     */
    data: SelfEvaluationCreateManyInput | SelfEvaluationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SelfEvaluation createManyAndReturn
   */
  export type SelfEvaluationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * The data used to create many SelfEvaluations.
     */
    data: SelfEvaluationCreateManyInput | SelfEvaluationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SelfEvaluation update
   */
  export type SelfEvaluationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
    /**
     * The data needed to update a SelfEvaluation.
     */
    data: XOR<SelfEvaluationUpdateInput, SelfEvaluationUncheckedUpdateInput>
    /**
     * Choose, which SelfEvaluation to update.
     */
    where: SelfEvaluationWhereUniqueInput
  }

  /**
   * SelfEvaluation updateMany
   */
  export type SelfEvaluationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SelfEvaluations.
     */
    data: XOR<SelfEvaluationUpdateManyMutationInput, SelfEvaluationUncheckedUpdateManyInput>
    /**
     * Filter which SelfEvaluations to update
     */
    where?: SelfEvaluationWhereInput
    /**
     * Limit how many SelfEvaluations to update.
     */
    limit?: number
  }

  /**
   * SelfEvaluation updateManyAndReturn
   */
  export type SelfEvaluationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * The data used to update SelfEvaluations.
     */
    data: XOR<SelfEvaluationUpdateManyMutationInput, SelfEvaluationUncheckedUpdateManyInput>
    /**
     * Filter which SelfEvaluations to update
     */
    where?: SelfEvaluationWhereInput
    /**
     * Limit how many SelfEvaluations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SelfEvaluation upsert
   */
  export type SelfEvaluationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
    /**
     * The filter to search for the SelfEvaluation to update in case it exists.
     */
    where: SelfEvaluationWhereUniqueInput
    /**
     * In case the SelfEvaluation found by the `where` argument doesn't exist, create a new SelfEvaluation with this data.
     */
    create: XOR<SelfEvaluationCreateInput, SelfEvaluationUncheckedCreateInput>
    /**
     * In case the SelfEvaluation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SelfEvaluationUpdateInput, SelfEvaluationUncheckedUpdateInput>
  }

  /**
   * SelfEvaluation delete
   */
  export type SelfEvaluationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
    /**
     * Filter which SelfEvaluation to delete.
     */
    where: SelfEvaluationWhereUniqueInput
  }

  /**
   * SelfEvaluation deleteMany
   */
  export type SelfEvaluationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SelfEvaluations to delete
     */
    where?: SelfEvaluationWhereInput
    /**
     * Limit how many SelfEvaluations to delete.
     */
    limit?: number
  }

  /**
   * SelfEvaluation without action
   */
  export type SelfEvaluationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SelfEvaluation
     */
    select?: SelfEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SelfEvaluation
     */
    omit?: SelfEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SelfEvaluationInclude<ExtArgs> | null
  }


  /**
   * Model PeerEvaluation
   */

  export type AggregatePeerEvaluation = {
    _count: PeerEvaluationCountAggregateOutputType | null
    _avg: PeerEvaluationAvgAggregateOutputType | null
    _sum: PeerEvaluationSumAggregateOutputType | null
    _min: PeerEvaluationMinAggregateOutputType | null
    _max: PeerEvaluationMaxAggregateOutputType | null
  }

  export type PeerEvaluationAvgAggregateOutputType = {
    score: number | null
  }

  export type PeerEvaluationSumAggregateOutputType = {
    score: number | null
  }

  export type PeerEvaluationMinAggregateOutputType = {
    id: string | null
    score: number | null
    feedback: string | null
    evaluatorId: string | null
    evaluatedId: string | null
    courseId: string | null
    periodId: string | null
    createdAt: Date | null
  }

  export type PeerEvaluationMaxAggregateOutputType = {
    id: string | null
    score: number | null
    feedback: string | null
    evaluatorId: string | null
    evaluatedId: string | null
    courseId: string | null
    periodId: string | null
    createdAt: Date | null
  }

  export type PeerEvaluationCountAggregateOutputType = {
    id: number
    score: number
    feedback: number
    evaluatorId: number
    evaluatedId: number
    courseId: number
    periodId: number
    createdAt: number
    _all: number
  }


  export type PeerEvaluationAvgAggregateInputType = {
    score?: true
  }

  export type PeerEvaluationSumAggregateInputType = {
    score?: true
  }

  export type PeerEvaluationMinAggregateInputType = {
    id?: true
    score?: true
    feedback?: true
    evaluatorId?: true
    evaluatedId?: true
    courseId?: true
    periodId?: true
    createdAt?: true
  }

  export type PeerEvaluationMaxAggregateInputType = {
    id?: true
    score?: true
    feedback?: true
    evaluatorId?: true
    evaluatedId?: true
    courseId?: true
    periodId?: true
    createdAt?: true
  }

  export type PeerEvaluationCountAggregateInputType = {
    id?: true
    score?: true
    feedback?: true
    evaluatorId?: true
    evaluatedId?: true
    courseId?: true
    periodId?: true
    createdAt?: true
    _all?: true
  }

  export type PeerEvaluationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PeerEvaluation to aggregate.
     */
    where?: PeerEvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PeerEvaluations to fetch.
     */
    orderBy?: PeerEvaluationOrderByWithRelationInput | PeerEvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PeerEvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PeerEvaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PeerEvaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PeerEvaluations
    **/
    _count?: true | PeerEvaluationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PeerEvaluationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PeerEvaluationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PeerEvaluationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PeerEvaluationMaxAggregateInputType
  }

  export type GetPeerEvaluationAggregateType<T extends PeerEvaluationAggregateArgs> = {
        [P in keyof T & keyof AggregatePeerEvaluation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePeerEvaluation[P]>
      : GetScalarType<T[P], AggregatePeerEvaluation[P]>
  }




  export type PeerEvaluationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PeerEvaluationWhereInput
    orderBy?: PeerEvaluationOrderByWithAggregationInput | PeerEvaluationOrderByWithAggregationInput[]
    by: PeerEvaluationScalarFieldEnum[] | PeerEvaluationScalarFieldEnum
    having?: PeerEvaluationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PeerEvaluationCountAggregateInputType | true
    _avg?: PeerEvaluationAvgAggregateInputType
    _sum?: PeerEvaluationSumAggregateInputType
    _min?: PeerEvaluationMinAggregateInputType
    _max?: PeerEvaluationMaxAggregateInputType
  }

  export type PeerEvaluationGroupByOutputType = {
    id: string
    score: number
    feedback: string | null
    evaluatorId: string
    evaluatedId: string
    courseId: string
    periodId: string
    createdAt: Date
    _count: PeerEvaluationCountAggregateOutputType | null
    _avg: PeerEvaluationAvgAggregateOutputType | null
    _sum: PeerEvaluationSumAggregateOutputType | null
    _min: PeerEvaluationMinAggregateOutputType | null
    _max: PeerEvaluationMaxAggregateOutputType | null
  }

  type GetPeerEvaluationGroupByPayload<T extends PeerEvaluationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PeerEvaluationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PeerEvaluationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PeerEvaluationGroupByOutputType[P]>
            : GetScalarType<T[P], PeerEvaluationGroupByOutputType[P]>
        }
      >
    >


  export type PeerEvaluationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    score?: boolean
    feedback?: boolean
    evaluatorId?: boolean
    evaluatedId?: boolean
    courseId?: boolean
    periodId?: boolean
    createdAt?: boolean
    evaluator?: boolean | UserDefaultArgs<ExtArgs>
    evaluated?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["peerEvaluation"]>

  export type PeerEvaluationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    score?: boolean
    feedback?: boolean
    evaluatorId?: boolean
    evaluatedId?: boolean
    courseId?: boolean
    periodId?: boolean
    createdAt?: boolean
    evaluator?: boolean | UserDefaultArgs<ExtArgs>
    evaluated?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["peerEvaluation"]>

  export type PeerEvaluationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    score?: boolean
    feedback?: boolean
    evaluatorId?: boolean
    evaluatedId?: boolean
    courseId?: boolean
    periodId?: boolean
    createdAt?: boolean
    evaluator?: boolean | UserDefaultArgs<ExtArgs>
    evaluated?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["peerEvaluation"]>

  export type PeerEvaluationSelectScalar = {
    id?: boolean
    score?: boolean
    feedback?: boolean
    evaluatorId?: boolean
    evaluatedId?: boolean
    courseId?: boolean
    periodId?: boolean
    createdAt?: boolean
  }

  export type PeerEvaluationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "score" | "feedback" | "evaluatorId" | "evaluatedId" | "courseId" | "periodId" | "createdAt", ExtArgs["result"]["peerEvaluation"]>
  export type PeerEvaluationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    evaluator?: boolean | UserDefaultArgs<ExtArgs>
    evaluated?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PeerEvaluationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    evaluator?: boolean | UserDefaultArgs<ExtArgs>
    evaluated?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PeerEvaluationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    evaluator?: boolean | UserDefaultArgs<ExtArgs>
    evaluated?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $PeerEvaluationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PeerEvaluation"
    objects: {
      evaluator: Prisma.$UserPayload<ExtArgs>
      evaluated: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      score: number
      feedback: string | null
      evaluatorId: string
      evaluatedId: string
      courseId: string
      periodId: string
      createdAt: Date
    }, ExtArgs["result"]["peerEvaluation"]>
    composites: {}
  }

  type PeerEvaluationGetPayload<S extends boolean | null | undefined | PeerEvaluationDefaultArgs> = $Result.GetResult<Prisma.$PeerEvaluationPayload, S>

  type PeerEvaluationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PeerEvaluationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PeerEvaluationCountAggregateInputType | true
    }

  export interface PeerEvaluationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PeerEvaluation'], meta: { name: 'PeerEvaluation' } }
    /**
     * Find zero or one PeerEvaluation that matches the filter.
     * @param {PeerEvaluationFindUniqueArgs} args - Arguments to find a PeerEvaluation
     * @example
     * // Get one PeerEvaluation
     * const peerEvaluation = await prisma.peerEvaluation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PeerEvaluationFindUniqueArgs>(args: SelectSubset<T, PeerEvaluationFindUniqueArgs<ExtArgs>>): Prisma__PeerEvaluationClient<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PeerEvaluation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PeerEvaluationFindUniqueOrThrowArgs} args - Arguments to find a PeerEvaluation
     * @example
     * // Get one PeerEvaluation
     * const peerEvaluation = await prisma.peerEvaluation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PeerEvaluationFindUniqueOrThrowArgs>(args: SelectSubset<T, PeerEvaluationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PeerEvaluationClient<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PeerEvaluation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeerEvaluationFindFirstArgs} args - Arguments to find a PeerEvaluation
     * @example
     * // Get one PeerEvaluation
     * const peerEvaluation = await prisma.peerEvaluation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PeerEvaluationFindFirstArgs>(args?: SelectSubset<T, PeerEvaluationFindFirstArgs<ExtArgs>>): Prisma__PeerEvaluationClient<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PeerEvaluation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeerEvaluationFindFirstOrThrowArgs} args - Arguments to find a PeerEvaluation
     * @example
     * // Get one PeerEvaluation
     * const peerEvaluation = await prisma.peerEvaluation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PeerEvaluationFindFirstOrThrowArgs>(args?: SelectSubset<T, PeerEvaluationFindFirstOrThrowArgs<ExtArgs>>): Prisma__PeerEvaluationClient<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PeerEvaluations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeerEvaluationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PeerEvaluations
     * const peerEvaluations = await prisma.peerEvaluation.findMany()
     * 
     * // Get first 10 PeerEvaluations
     * const peerEvaluations = await prisma.peerEvaluation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const peerEvaluationWithIdOnly = await prisma.peerEvaluation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PeerEvaluationFindManyArgs>(args?: SelectSubset<T, PeerEvaluationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PeerEvaluation.
     * @param {PeerEvaluationCreateArgs} args - Arguments to create a PeerEvaluation.
     * @example
     * // Create one PeerEvaluation
     * const PeerEvaluation = await prisma.peerEvaluation.create({
     *   data: {
     *     // ... data to create a PeerEvaluation
     *   }
     * })
     * 
     */
    create<T extends PeerEvaluationCreateArgs>(args: SelectSubset<T, PeerEvaluationCreateArgs<ExtArgs>>): Prisma__PeerEvaluationClient<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PeerEvaluations.
     * @param {PeerEvaluationCreateManyArgs} args - Arguments to create many PeerEvaluations.
     * @example
     * // Create many PeerEvaluations
     * const peerEvaluation = await prisma.peerEvaluation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PeerEvaluationCreateManyArgs>(args?: SelectSubset<T, PeerEvaluationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PeerEvaluations and returns the data saved in the database.
     * @param {PeerEvaluationCreateManyAndReturnArgs} args - Arguments to create many PeerEvaluations.
     * @example
     * // Create many PeerEvaluations
     * const peerEvaluation = await prisma.peerEvaluation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PeerEvaluations and only return the `id`
     * const peerEvaluationWithIdOnly = await prisma.peerEvaluation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PeerEvaluationCreateManyAndReturnArgs>(args?: SelectSubset<T, PeerEvaluationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PeerEvaluation.
     * @param {PeerEvaluationDeleteArgs} args - Arguments to delete one PeerEvaluation.
     * @example
     * // Delete one PeerEvaluation
     * const PeerEvaluation = await prisma.peerEvaluation.delete({
     *   where: {
     *     // ... filter to delete one PeerEvaluation
     *   }
     * })
     * 
     */
    delete<T extends PeerEvaluationDeleteArgs>(args: SelectSubset<T, PeerEvaluationDeleteArgs<ExtArgs>>): Prisma__PeerEvaluationClient<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PeerEvaluation.
     * @param {PeerEvaluationUpdateArgs} args - Arguments to update one PeerEvaluation.
     * @example
     * // Update one PeerEvaluation
     * const peerEvaluation = await prisma.peerEvaluation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PeerEvaluationUpdateArgs>(args: SelectSubset<T, PeerEvaluationUpdateArgs<ExtArgs>>): Prisma__PeerEvaluationClient<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PeerEvaluations.
     * @param {PeerEvaluationDeleteManyArgs} args - Arguments to filter PeerEvaluations to delete.
     * @example
     * // Delete a few PeerEvaluations
     * const { count } = await prisma.peerEvaluation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PeerEvaluationDeleteManyArgs>(args?: SelectSubset<T, PeerEvaluationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PeerEvaluations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeerEvaluationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PeerEvaluations
     * const peerEvaluation = await prisma.peerEvaluation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PeerEvaluationUpdateManyArgs>(args: SelectSubset<T, PeerEvaluationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PeerEvaluations and returns the data updated in the database.
     * @param {PeerEvaluationUpdateManyAndReturnArgs} args - Arguments to update many PeerEvaluations.
     * @example
     * // Update many PeerEvaluations
     * const peerEvaluation = await prisma.peerEvaluation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PeerEvaluations and only return the `id`
     * const peerEvaluationWithIdOnly = await prisma.peerEvaluation.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PeerEvaluationUpdateManyAndReturnArgs>(args: SelectSubset<T, PeerEvaluationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PeerEvaluation.
     * @param {PeerEvaluationUpsertArgs} args - Arguments to update or create a PeerEvaluation.
     * @example
     * // Update or create a PeerEvaluation
     * const peerEvaluation = await prisma.peerEvaluation.upsert({
     *   create: {
     *     // ... data to create a PeerEvaluation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PeerEvaluation we want to update
     *   }
     * })
     */
    upsert<T extends PeerEvaluationUpsertArgs>(args: SelectSubset<T, PeerEvaluationUpsertArgs<ExtArgs>>): Prisma__PeerEvaluationClient<$Result.GetResult<Prisma.$PeerEvaluationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PeerEvaluations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeerEvaluationCountArgs} args - Arguments to filter PeerEvaluations to count.
     * @example
     * // Count the number of PeerEvaluations
     * const count = await prisma.peerEvaluation.count({
     *   where: {
     *     // ... the filter for the PeerEvaluations we want to count
     *   }
     * })
    **/
    count<T extends PeerEvaluationCountArgs>(
      args?: Subset<T, PeerEvaluationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PeerEvaluationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PeerEvaluation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeerEvaluationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PeerEvaluationAggregateArgs>(args: Subset<T, PeerEvaluationAggregateArgs>): Prisma.PrismaPromise<GetPeerEvaluationAggregateType<T>>

    /**
     * Group by PeerEvaluation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PeerEvaluationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PeerEvaluationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PeerEvaluationGroupByArgs['orderBy'] }
        : { orderBy?: PeerEvaluationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PeerEvaluationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPeerEvaluationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PeerEvaluation model
   */
  readonly fields: PeerEvaluationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PeerEvaluation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PeerEvaluationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    evaluator<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    evaluated<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PeerEvaluation model
   */
  interface PeerEvaluationFieldRefs {
    readonly id: FieldRef<"PeerEvaluation", 'String'>
    readonly score: FieldRef<"PeerEvaluation", 'Float'>
    readonly feedback: FieldRef<"PeerEvaluation", 'String'>
    readonly evaluatorId: FieldRef<"PeerEvaluation", 'String'>
    readonly evaluatedId: FieldRef<"PeerEvaluation", 'String'>
    readonly courseId: FieldRef<"PeerEvaluation", 'String'>
    readonly periodId: FieldRef<"PeerEvaluation", 'String'>
    readonly createdAt: FieldRef<"PeerEvaluation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PeerEvaluation findUnique
   */
  export type PeerEvaluationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    /**
     * Filter, which PeerEvaluation to fetch.
     */
    where: PeerEvaluationWhereUniqueInput
  }

  /**
   * PeerEvaluation findUniqueOrThrow
   */
  export type PeerEvaluationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    /**
     * Filter, which PeerEvaluation to fetch.
     */
    where: PeerEvaluationWhereUniqueInput
  }

  /**
   * PeerEvaluation findFirst
   */
  export type PeerEvaluationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    /**
     * Filter, which PeerEvaluation to fetch.
     */
    where?: PeerEvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PeerEvaluations to fetch.
     */
    orderBy?: PeerEvaluationOrderByWithRelationInput | PeerEvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PeerEvaluations.
     */
    cursor?: PeerEvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PeerEvaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PeerEvaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PeerEvaluations.
     */
    distinct?: PeerEvaluationScalarFieldEnum | PeerEvaluationScalarFieldEnum[]
  }

  /**
   * PeerEvaluation findFirstOrThrow
   */
  export type PeerEvaluationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    /**
     * Filter, which PeerEvaluation to fetch.
     */
    where?: PeerEvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PeerEvaluations to fetch.
     */
    orderBy?: PeerEvaluationOrderByWithRelationInput | PeerEvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PeerEvaluations.
     */
    cursor?: PeerEvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PeerEvaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PeerEvaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PeerEvaluations.
     */
    distinct?: PeerEvaluationScalarFieldEnum | PeerEvaluationScalarFieldEnum[]
  }

  /**
   * PeerEvaluation findMany
   */
  export type PeerEvaluationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    /**
     * Filter, which PeerEvaluations to fetch.
     */
    where?: PeerEvaluationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PeerEvaluations to fetch.
     */
    orderBy?: PeerEvaluationOrderByWithRelationInput | PeerEvaluationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PeerEvaluations.
     */
    cursor?: PeerEvaluationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PeerEvaluations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PeerEvaluations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PeerEvaluations.
     */
    distinct?: PeerEvaluationScalarFieldEnum | PeerEvaluationScalarFieldEnum[]
  }

  /**
   * PeerEvaluation create
   */
  export type PeerEvaluationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    /**
     * The data needed to create a PeerEvaluation.
     */
    data: XOR<PeerEvaluationCreateInput, PeerEvaluationUncheckedCreateInput>
  }

  /**
   * PeerEvaluation createMany
   */
  export type PeerEvaluationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PeerEvaluations.
     */
    data: PeerEvaluationCreateManyInput | PeerEvaluationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PeerEvaluation createManyAndReturn
   */
  export type PeerEvaluationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * The data used to create many PeerEvaluations.
     */
    data: PeerEvaluationCreateManyInput | PeerEvaluationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PeerEvaluation update
   */
  export type PeerEvaluationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    /**
     * The data needed to update a PeerEvaluation.
     */
    data: XOR<PeerEvaluationUpdateInput, PeerEvaluationUncheckedUpdateInput>
    /**
     * Choose, which PeerEvaluation to update.
     */
    where: PeerEvaluationWhereUniqueInput
  }

  /**
   * PeerEvaluation updateMany
   */
  export type PeerEvaluationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PeerEvaluations.
     */
    data: XOR<PeerEvaluationUpdateManyMutationInput, PeerEvaluationUncheckedUpdateManyInput>
    /**
     * Filter which PeerEvaluations to update
     */
    where?: PeerEvaluationWhereInput
    /**
     * Limit how many PeerEvaluations to update.
     */
    limit?: number
  }

  /**
   * PeerEvaluation updateManyAndReturn
   */
  export type PeerEvaluationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * The data used to update PeerEvaluations.
     */
    data: XOR<PeerEvaluationUpdateManyMutationInput, PeerEvaluationUncheckedUpdateManyInput>
    /**
     * Filter which PeerEvaluations to update
     */
    where?: PeerEvaluationWhereInput
    /**
     * Limit how many PeerEvaluations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PeerEvaluation upsert
   */
  export type PeerEvaluationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    /**
     * The filter to search for the PeerEvaluation to update in case it exists.
     */
    where: PeerEvaluationWhereUniqueInput
    /**
     * In case the PeerEvaluation found by the `where` argument doesn't exist, create a new PeerEvaluation with this data.
     */
    create: XOR<PeerEvaluationCreateInput, PeerEvaluationUncheckedCreateInput>
    /**
     * In case the PeerEvaluation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PeerEvaluationUpdateInput, PeerEvaluationUncheckedUpdateInput>
  }

  /**
   * PeerEvaluation delete
   */
  export type PeerEvaluationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
    /**
     * Filter which PeerEvaluation to delete.
     */
    where: PeerEvaluationWhereUniqueInput
  }

  /**
   * PeerEvaluation deleteMany
   */
  export type PeerEvaluationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PeerEvaluations to delete
     */
    where?: PeerEvaluationWhereInput
    /**
     * Limit how many PeerEvaluations to delete.
     */
    limit?: number
  }

  /**
   * PeerEvaluation without action
   */
  export type PeerEvaluationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PeerEvaluation
     */
    select?: PeerEvaluationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PeerEvaluation
     */
    omit?: PeerEvaluationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PeerEvaluationInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    password: 'password',
    name: 'name',
    lastName: 'lastName',
    role: 'role',
    avatar: 'avatar',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const CourseScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    code: 'code',
    isActive: 'isActive',
    teacherId: 'teacherId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CourseScalarFieldEnum = (typeof CourseScalarFieldEnum)[keyof typeof CourseScalarFieldEnum]


  export const PeriodScalarFieldEnum: {
    id: 'id',
    name: 'name',
    startDate: 'startDate',
    endDate: 'endDate',
    isActive: 'isActive',
    courseId: 'courseId',
    createdAt: 'createdAt'
  };

  export type PeriodScalarFieldEnum = (typeof PeriodScalarFieldEnum)[keyof typeof PeriodScalarFieldEnum]


  export const EnrollmentScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    courseId: 'courseId',
    createdAt: 'createdAt'
  };

  export type EnrollmentScalarFieldEnum = (typeof EnrollmentScalarFieldEnum)[keyof typeof EnrollmentScalarFieldEnum]


  export const ClassScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    code: 'code',
    status: 'status',
    courseId: 'courseId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ClassScalarFieldEnum = (typeof ClassScalarFieldEnum)[keyof typeof ClassScalarFieldEnum]


  export const SlideScalarFieldEnum: {
    id: 'id',
    order: 'order',
    type: 'type',
    title: 'title',
    content: 'content',
    classId: 'classId',
    createdAt: 'createdAt'
  };

  export type SlideScalarFieldEnum = (typeof SlideScalarFieldEnum)[keyof typeof SlideScalarFieldEnum]


  export const GradebookStructureScalarFieldEnum: {
    id: 'id',
    courseId: 'courseId'
  };

  export type GradebookStructureScalarFieldEnum = (typeof GradebookStructureScalarFieldEnum)[keyof typeof GradebookStructureScalarFieldEnum]


  export const AspectScalarFieldEnum: {
    id: 'id',
    name: 'name',
    weight: 'weight',
    structureId: 'structureId'
  };

  export type AspectScalarFieldEnum = (typeof AspectScalarFieldEnum)[keyof typeof AspectScalarFieldEnum]


  export const IndicatorScalarFieldEnum: {
    id: 'id',
    name: 'name',
    weight: 'weight',
    aspectId: 'aspectId'
  };

  export type IndicatorScalarFieldEnum = (typeof IndicatorScalarFieldEnum)[keyof typeof IndicatorScalarFieldEnum]


  export const ActivityScalarFieldEnum: {
    id: 'id',
    name: 'name',
    weight: 'weight',
    maxScore: 'maxScore',
    indicatorId: 'indicatorId'
  };

  export type ActivityScalarFieldEnum = (typeof ActivityScalarFieldEnum)[keyof typeof ActivityScalarFieldEnum]


  export const GradeEntryScalarFieldEnum: {
    id: 'id',
    score: 'score',
    feedback: 'feedback',
    userId: 'userId',
    activityId: 'activityId',
    periodId: 'periodId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type GradeEntryScalarFieldEnum = (typeof GradeEntryScalarFieldEnum)[keyof typeof GradeEntryScalarFieldEnum]


  export const SelfEvaluationScalarFieldEnum: {
    id: 'id',
    score: 'score',
    feedback: 'feedback',
    userId: 'userId',
    courseId: 'courseId',
    periodId: 'periodId',
    createdAt: 'createdAt'
  };

  export type SelfEvaluationScalarFieldEnum = (typeof SelfEvaluationScalarFieldEnum)[keyof typeof SelfEvaluationScalarFieldEnum]


  export const PeerEvaluationScalarFieldEnum: {
    id: 'id',
    score: 'score',
    feedback: 'feedback',
    evaluatorId: 'evaluatorId',
    evaluatedId: 'evaluatedId',
    courseId: 'courseId',
    periodId: 'periodId',
    createdAt: 'createdAt'
  };

  export type PeerEvaluationScalarFieldEnum = (typeof PeerEvaluationScalarFieldEnum)[keyof typeof PeerEvaluationScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'ClassStatus'
   */
  export type EnumClassStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ClassStatus'>
    


  /**
   * Reference to a field of type 'ClassStatus[]'
   */
  export type ListEnumClassStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ClassStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'SlideType'
   */
  export type EnumSlideTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SlideType'>
    


  /**
   * Reference to a field of type 'SlideType[]'
   */
  export type ListEnumSlideTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SlideType[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    lastName?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    avatar?: StringNullableFilter<"User"> | string | null
    isActive?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    teacherCourses?: CourseListRelationFilter
    enrollments?: EnrollmentListRelationFilter
    gradebookEntries?: GradeEntryListRelationFilter
    selfEvaluations?: SelfEvaluationListRelationFilter
    peerEvaluationsGiven?: PeerEvaluationListRelationFilter
    peerEvaluationsReceived?: PeerEvaluationListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    name?: SortOrder
    lastName?: SortOrder
    role?: SortOrder
    avatar?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    teacherCourses?: CourseOrderByRelationAggregateInput
    enrollments?: EnrollmentOrderByRelationAggregateInput
    gradebookEntries?: GradeEntryOrderByRelationAggregateInput
    selfEvaluations?: SelfEvaluationOrderByRelationAggregateInput
    peerEvaluationsGiven?: PeerEvaluationOrderByRelationAggregateInput
    peerEvaluationsReceived?: PeerEvaluationOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    password?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    lastName?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    avatar?: StringNullableFilter<"User"> | string | null
    isActive?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    teacherCourses?: CourseListRelationFilter
    enrollments?: EnrollmentListRelationFilter
    gradebookEntries?: GradeEntryListRelationFilter
    selfEvaluations?: SelfEvaluationListRelationFilter
    peerEvaluationsGiven?: PeerEvaluationListRelationFilter
    peerEvaluationsReceived?: PeerEvaluationListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    name?: SortOrder
    lastName?: SortOrder
    role?: SortOrder
    avatar?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    lastName?: StringWithAggregatesFilter<"User"> | string
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    avatar?: StringNullableWithAggregatesFilter<"User"> | string | null
    isActive?: BoolWithAggregatesFilter<"User"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type CourseWhereInput = {
    AND?: CourseWhereInput | CourseWhereInput[]
    OR?: CourseWhereInput[]
    NOT?: CourseWhereInput | CourseWhereInput[]
    id?: StringFilter<"Course"> | string
    name?: StringFilter<"Course"> | string
    description?: StringNullableFilter<"Course"> | string | null
    code?: StringFilter<"Course"> | string
    isActive?: BoolFilter<"Course"> | boolean
    teacherId?: StringFilter<"Course"> | string
    createdAt?: DateTimeFilter<"Course"> | Date | string
    updatedAt?: DateTimeFilter<"Course"> | Date | string
    teacher?: XOR<UserScalarRelationFilter, UserWhereInput>
    enrollments?: EnrollmentListRelationFilter
    classes?: ClassListRelationFilter
    gradebookStructure?: XOR<GradebookStructureNullableScalarRelationFilter, GradebookStructureWhereInput> | null
    periods?: PeriodListRelationFilter
  }

  export type CourseOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    code?: SortOrder
    isActive?: SortOrder
    teacherId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    teacher?: UserOrderByWithRelationInput
    enrollments?: EnrollmentOrderByRelationAggregateInput
    classes?: ClassOrderByRelationAggregateInput
    gradebookStructure?: GradebookStructureOrderByWithRelationInput
    periods?: PeriodOrderByRelationAggregateInput
  }

  export type CourseWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    code?: string
    AND?: CourseWhereInput | CourseWhereInput[]
    OR?: CourseWhereInput[]
    NOT?: CourseWhereInput | CourseWhereInput[]
    name?: StringFilter<"Course"> | string
    description?: StringNullableFilter<"Course"> | string | null
    isActive?: BoolFilter<"Course"> | boolean
    teacherId?: StringFilter<"Course"> | string
    createdAt?: DateTimeFilter<"Course"> | Date | string
    updatedAt?: DateTimeFilter<"Course"> | Date | string
    teacher?: XOR<UserScalarRelationFilter, UserWhereInput>
    enrollments?: EnrollmentListRelationFilter
    classes?: ClassListRelationFilter
    gradebookStructure?: XOR<GradebookStructureNullableScalarRelationFilter, GradebookStructureWhereInput> | null
    periods?: PeriodListRelationFilter
  }, "id" | "code">

  export type CourseOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    code?: SortOrder
    isActive?: SortOrder
    teacherId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CourseCountOrderByAggregateInput
    _max?: CourseMaxOrderByAggregateInput
    _min?: CourseMinOrderByAggregateInput
  }

  export type CourseScalarWhereWithAggregatesInput = {
    AND?: CourseScalarWhereWithAggregatesInput | CourseScalarWhereWithAggregatesInput[]
    OR?: CourseScalarWhereWithAggregatesInput[]
    NOT?: CourseScalarWhereWithAggregatesInput | CourseScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Course"> | string
    name?: StringWithAggregatesFilter<"Course"> | string
    description?: StringNullableWithAggregatesFilter<"Course"> | string | null
    code?: StringWithAggregatesFilter<"Course"> | string
    isActive?: BoolWithAggregatesFilter<"Course"> | boolean
    teacherId?: StringWithAggregatesFilter<"Course"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Course"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Course"> | Date | string
  }

  export type PeriodWhereInput = {
    AND?: PeriodWhereInput | PeriodWhereInput[]
    OR?: PeriodWhereInput[]
    NOT?: PeriodWhereInput | PeriodWhereInput[]
    id?: StringFilter<"Period"> | string
    name?: StringFilter<"Period"> | string
    startDate?: DateTimeFilter<"Period"> | Date | string
    endDate?: DateTimeFilter<"Period"> | Date | string
    isActive?: BoolFilter<"Period"> | boolean
    courseId?: StringFilter<"Period"> | string
    createdAt?: DateTimeFilter<"Period"> | Date | string
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
    gradeEntries?: GradeEntryListRelationFilter
  }

  export type PeriodOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isActive?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
    course?: CourseOrderByWithRelationInput
    gradeEntries?: GradeEntryOrderByRelationAggregateInput
  }

  export type PeriodWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PeriodWhereInput | PeriodWhereInput[]
    OR?: PeriodWhereInput[]
    NOT?: PeriodWhereInput | PeriodWhereInput[]
    name?: StringFilter<"Period"> | string
    startDate?: DateTimeFilter<"Period"> | Date | string
    endDate?: DateTimeFilter<"Period"> | Date | string
    isActive?: BoolFilter<"Period"> | boolean
    courseId?: StringFilter<"Period"> | string
    createdAt?: DateTimeFilter<"Period"> | Date | string
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
    gradeEntries?: GradeEntryListRelationFilter
  }, "id">

  export type PeriodOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isActive?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
    _count?: PeriodCountOrderByAggregateInput
    _max?: PeriodMaxOrderByAggregateInput
    _min?: PeriodMinOrderByAggregateInput
  }

  export type PeriodScalarWhereWithAggregatesInput = {
    AND?: PeriodScalarWhereWithAggregatesInput | PeriodScalarWhereWithAggregatesInput[]
    OR?: PeriodScalarWhereWithAggregatesInput[]
    NOT?: PeriodScalarWhereWithAggregatesInput | PeriodScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Period"> | string
    name?: StringWithAggregatesFilter<"Period"> | string
    startDate?: DateTimeWithAggregatesFilter<"Period"> | Date | string
    endDate?: DateTimeWithAggregatesFilter<"Period"> | Date | string
    isActive?: BoolWithAggregatesFilter<"Period"> | boolean
    courseId?: StringWithAggregatesFilter<"Period"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Period"> | Date | string
  }

  export type EnrollmentWhereInput = {
    AND?: EnrollmentWhereInput | EnrollmentWhereInput[]
    OR?: EnrollmentWhereInput[]
    NOT?: EnrollmentWhereInput | EnrollmentWhereInput[]
    id?: StringFilter<"Enrollment"> | string
    userId?: StringFilter<"Enrollment"> | string
    courseId?: StringFilter<"Enrollment"> | string
    createdAt?: DateTimeFilter<"Enrollment"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
  }

  export type EnrollmentOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    course?: CourseOrderByWithRelationInput
  }

  export type EnrollmentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_courseId?: EnrollmentUserIdCourseIdCompoundUniqueInput
    AND?: EnrollmentWhereInput | EnrollmentWhereInput[]
    OR?: EnrollmentWhereInput[]
    NOT?: EnrollmentWhereInput | EnrollmentWhereInput[]
    userId?: StringFilter<"Enrollment"> | string
    courseId?: StringFilter<"Enrollment"> | string
    createdAt?: DateTimeFilter<"Enrollment"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
  }, "id" | "userId_courseId">

  export type EnrollmentOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
    _count?: EnrollmentCountOrderByAggregateInput
    _max?: EnrollmentMaxOrderByAggregateInput
    _min?: EnrollmentMinOrderByAggregateInput
  }

  export type EnrollmentScalarWhereWithAggregatesInput = {
    AND?: EnrollmentScalarWhereWithAggregatesInput | EnrollmentScalarWhereWithAggregatesInput[]
    OR?: EnrollmentScalarWhereWithAggregatesInput[]
    NOT?: EnrollmentScalarWhereWithAggregatesInput | EnrollmentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Enrollment"> | string
    userId?: StringWithAggregatesFilter<"Enrollment"> | string
    courseId?: StringWithAggregatesFilter<"Enrollment"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Enrollment"> | Date | string
  }

  export type ClassWhereInput = {
    AND?: ClassWhereInput | ClassWhereInput[]
    OR?: ClassWhereInput[]
    NOT?: ClassWhereInput | ClassWhereInput[]
    id?: StringFilter<"Class"> | string
    title?: StringFilter<"Class"> | string
    description?: StringNullableFilter<"Class"> | string | null
    code?: StringFilter<"Class"> | string
    status?: EnumClassStatusFilter<"Class"> | $Enums.ClassStatus
    courseId?: StringFilter<"Class"> | string
    createdAt?: DateTimeFilter<"Class"> | Date | string
    updatedAt?: DateTimeFilter<"Class"> | Date | string
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
    slides?: SlideListRelationFilter
  }

  export type ClassOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    code?: SortOrder
    status?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    course?: CourseOrderByWithRelationInput
    slides?: SlideOrderByRelationAggregateInput
  }

  export type ClassWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    code?: string
    AND?: ClassWhereInput | ClassWhereInput[]
    OR?: ClassWhereInput[]
    NOT?: ClassWhereInput | ClassWhereInput[]
    title?: StringFilter<"Class"> | string
    description?: StringNullableFilter<"Class"> | string | null
    status?: EnumClassStatusFilter<"Class"> | $Enums.ClassStatus
    courseId?: StringFilter<"Class"> | string
    createdAt?: DateTimeFilter<"Class"> | Date | string
    updatedAt?: DateTimeFilter<"Class"> | Date | string
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
    slides?: SlideListRelationFilter
  }, "id" | "code">

  export type ClassOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    code?: SortOrder
    status?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ClassCountOrderByAggregateInput
    _max?: ClassMaxOrderByAggregateInput
    _min?: ClassMinOrderByAggregateInput
  }

  export type ClassScalarWhereWithAggregatesInput = {
    AND?: ClassScalarWhereWithAggregatesInput | ClassScalarWhereWithAggregatesInput[]
    OR?: ClassScalarWhereWithAggregatesInput[]
    NOT?: ClassScalarWhereWithAggregatesInput | ClassScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Class"> | string
    title?: StringWithAggregatesFilter<"Class"> | string
    description?: StringNullableWithAggregatesFilter<"Class"> | string | null
    code?: StringWithAggregatesFilter<"Class"> | string
    status?: EnumClassStatusWithAggregatesFilter<"Class"> | $Enums.ClassStatus
    courseId?: StringWithAggregatesFilter<"Class"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Class"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Class"> | Date | string
  }

  export type SlideWhereInput = {
    AND?: SlideWhereInput | SlideWhereInput[]
    OR?: SlideWhereInput[]
    NOT?: SlideWhereInput | SlideWhereInput[]
    id?: StringFilter<"Slide"> | string
    order?: IntFilter<"Slide"> | number
    type?: EnumSlideTypeFilter<"Slide"> | $Enums.SlideType
    title?: StringFilter<"Slide"> | string
    content?: JsonNullableFilter<"Slide">
    classId?: StringFilter<"Slide"> | string
    createdAt?: DateTimeFilter<"Slide"> | Date | string
    class?: XOR<ClassScalarRelationFilter, ClassWhereInput>
  }

  export type SlideOrderByWithRelationInput = {
    id?: SortOrder
    order?: SortOrder
    type?: SortOrder
    title?: SortOrder
    content?: SortOrderInput | SortOrder
    classId?: SortOrder
    createdAt?: SortOrder
    class?: ClassOrderByWithRelationInput
  }

  export type SlideWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SlideWhereInput | SlideWhereInput[]
    OR?: SlideWhereInput[]
    NOT?: SlideWhereInput | SlideWhereInput[]
    order?: IntFilter<"Slide"> | number
    type?: EnumSlideTypeFilter<"Slide"> | $Enums.SlideType
    title?: StringFilter<"Slide"> | string
    content?: JsonNullableFilter<"Slide">
    classId?: StringFilter<"Slide"> | string
    createdAt?: DateTimeFilter<"Slide"> | Date | string
    class?: XOR<ClassScalarRelationFilter, ClassWhereInput>
  }, "id">

  export type SlideOrderByWithAggregationInput = {
    id?: SortOrder
    order?: SortOrder
    type?: SortOrder
    title?: SortOrder
    content?: SortOrderInput | SortOrder
    classId?: SortOrder
    createdAt?: SortOrder
    _count?: SlideCountOrderByAggregateInput
    _avg?: SlideAvgOrderByAggregateInput
    _max?: SlideMaxOrderByAggregateInput
    _min?: SlideMinOrderByAggregateInput
    _sum?: SlideSumOrderByAggregateInput
  }

  export type SlideScalarWhereWithAggregatesInput = {
    AND?: SlideScalarWhereWithAggregatesInput | SlideScalarWhereWithAggregatesInput[]
    OR?: SlideScalarWhereWithAggregatesInput[]
    NOT?: SlideScalarWhereWithAggregatesInput | SlideScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Slide"> | string
    order?: IntWithAggregatesFilter<"Slide"> | number
    type?: EnumSlideTypeWithAggregatesFilter<"Slide"> | $Enums.SlideType
    title?: StringWithAggregatesFilter<"Slide"> | string
    content?: JsonNullableWithAggregatesFilter<"Slide">
    classId?: StringWithAggregatesFilter<"Slide"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Slide"> | Date | string
  }

  export type GradebookStructureWhereInput = {
    AND?: GradebookStructureWhereInput | GradebookStructureWhereInput[]
    OR?: GradebookStructureWhereInput[]
    NOT?: GradebookStructureWhereInput | GradebookStructureWhereInput[]
    id?: StringFilter<"GradebookStructure"> | string
    courseId?: StringFilter<"GradebookStructure"> | string
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
    aspects?: AspectListRelationFilter
  }

  export type GradebookStructureOrderByWithRelationInput = {
    id?: SortOrder
    courseId?: SortOrder
    course?: CourseOrderByWithRelationInput
    aspects?: AspectOrderByRelationAggregateInput
  }

  export type GradebookStructureWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    courseId?: string
    AND?: GradebookStructureWhereInput | GradebookStructureWhereInput[]
    OR?: GradebookStructureWhereInput[]
    NOT?: GradebookStructureWhereInput | GradebookStructureWhereInput[]
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
    aspects?: AspectListRelationFilter
  }, "id" | "courseId">

  export type GradebookStructureOrderByWithAggregationInput = {
    id?: SortOrder
    courseId?: SortOrder
    _count?: GradebookStructureCountOrderByAggregateInput
    _max?: GradebookStructureMaxOrderByAggregateInput
    _min?: GradebookStructureMinOrderByAggregateInput
  }

  export type GradebookStructureScalarWhereWithAggregatesInput = {
    AND?: GradebookStructureScalarWhereWithAggregatesInput | GradebookStructureScalarWhereWithAggregatesInput[]
    OR?: GradebookStructureScalarWhereWithAggregatesInput[]
    NOT?: GradebookStructureScalarWhereWithAggregatesInput | GradebookStructureScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"GradebookStructure"> | string
    courseId?: StringWithAggregatesFilter<"GradebookStructure"> | string
  }

  export type AspectWhereInput = {
    AND?: AspectWhereInput | AspectWhereInput[]
    OR?: AspectWhereInput[]
    NOT?: AspectWhereInput | AspectWhereInput[]
    id?: StringFilter<"Aspect"> | string
    name?: StringFilter<"Aspect"> | string
    weight?: FloatFilter<"Aspect"> | number
    structureId?: StringFilter<"Aspect"> | string
    structure?: XOR<GradebookStructureScalarRelationFilter, GradebookStructureWhereInput>
    indicators?: IndicatorListRelationFilter
  }

  export type AspectOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    structureId?: SortOrder
    structure?: GradebookStructureOrderByWithRelationInput
    indicators?: IndicatorOrderByRelationAggregateInput
  }

  export type AspectWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AspectWhereInput | AspectWhereInput[]
    OR?: AspectWhereInput[]
    NOT?: AspectWhereInput | AspectWhereInput[]
    name?: StringFilter<"Aspect"> | string
    weight?: FloatFilter<"Aspect"> | number
    structureId?: StringFilter<"Aspect"> | string
    structure?: XOR<GradebookStructureScalarRelationFilter, GradebookStructureWhereInput>
    indicators?: IndicatorListRelationFilter
  }, "id">

  export type AspectOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    structureId?: SortOrder
    _count?: AspectCountOrderByAggregateInput
    _avg?: AspectAvgOrderByAggregateInput
    _max?: AspectMaxOrderByAggregateInput
    _min?: AspectMinOrderByAggregateInput
    _sum?: AspectSumOrderByAggregateInput
  }

  export type AspectScalarWhereWithAggregatesInput = {
    AND?: AspectScalarWhereWithAggregatesInput | AspectScalarWhereWithAggregatesInput[]
    OR?: AspectScalarWhereWithAggregatesInput[]
    NOT?: AspectScalarWhereWithAggregatesInput | AspectScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Aspect"> | string
    name?: StringWithAggregatesFilter<"Aspect"> | string
    weight?: FloatWithAggregatesFilter<"Aspect"> | number
    structureId?: StringWithAggregatesFilter<"Aspect"> | string
  }

  export type IndicatorWhereInput = {
    AND?: IndicatorWhereInput | IndicatorWhereInput[]
    OR?: IndicatorWhereInput[]
    NOT?: IndicatorWhereInput | IndicatorWhereInput[]
    id?: StringFilter<"Indicator"> | string
    name?: StringFilter<"Indicator"> | string
    weight?: FloatFilter<"Indicator"> | number
    aspectId?: StringFilter<"Indicator"> | string
    aspect?: XOR<AspectScalarRelationFilter, AspectWhereInput>
    activities?: ActivityListRelationFilter
  }

  export type IndicatorOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    aspectId?: SortOrder
    aspect?: AspectOrderByWithRelationInput
    activities?: ActivityOrderByRelationAggregateInput
  }

  export type IndicatorWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: IndicatorWhereInput | IndicatorWhereInput[]
    OR?: IndicatorWhereInput[]
    NOT?: IndicatorWhereInput | IndicatorWhereInput[]
    name?: StringFilter<"Indicator"> | string
    weight?: FloatFilter<"Indicator"> | number
    aspectId?: StringFilter<"Indicator"> | string
    aspect?: XOR<AspectScalarRelationFilter, AspectWhereInput>
    activities?: ActivityListRelationFilter
  }, "id">

  export type IndicatorOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    aspectId?: SortOrder
    _count?: IndicatorCountOrderByAggregateInput
    _avg?: IndicatorAvgOrderByAggregateInput
    _max?: IndicatorMaxOrderByAggregateInput
    _min?: IndicatorMinOrderByAggregateInput
    _sum?: IndicatorSumOrderByAggregateInput
  }

  export type IndicatorScalarWhereWithAggregatesInput = {
    AND?: IndicatorScalarWhereWithAggregatesInput | IndicatorScalarWhereWithAggregatesInput[]
    OR?: IndicatorScalarWhereWithAggregatesInput[]
    NOT?: IndicatorScalarWhereWithAggregatesInput | IndicatorScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Indicator"> | string
    name?: StringWithAggregatesFilter<"Indicator"> | string
    weight?: FloatWithAggregatesFilter<"Indicator"> | number
    aspectId?: StringWithAggregatesFilter<"Indicator"> | string
  }

  export type ActivityWhereInput = {
    AND?: ActivityWhereInput | ActivityWhereInput[]
    OR?: ActivityWhereInput[]
    NOT?: ActivityWhereInput | ActivityWhereInput[]
    id?: StringFilter<"Activity"> | string
    name?: StringFilter<"Activity"> | string
    weight?: FloatFilter<"Activity"> | number
    maxScore?: FloatFilter<"Activity"> | number
    indicatorId?: StringFilter<"Activity"> | string
    indicator?: XOR<IndicatorScalarRelationFilter, IndicatorWhereInput>
    gradeEntries?: GradeEntryListRelationFilter
  }

  export type ActivityOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    maxScore?: SortOrder
    indicatorId?: SortOrder
    indicator?: IndicatorOrderByWithRelationInput
    gradeEntries?: GradeEntryOrderByRelationAggregateInput
  }

  export type ActivityWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ActivityWhereInput | ActivityWhereInput[]
    OR?: ActivityWhereInput[]
    NOT?: ActivityWhereInput | ActivityWhereInput[]
    name?: StringFilter<"Activity"> | string
    weight?: FloatFilter<"Activity"> | number
    maxScore?: FloatFilter<"Activity"> | number
    indicatorId?: StringFilter<"Activity"> | string
    indicator?: XOR<IndicatorScalarRelationFilter, IndicatorWhereInput>
    gradeEntries?: GradeEntryListRelationFilter
  }, "id">

  export type ActivityOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    maxScore?: SortOrder
    indicatorId?: SortOrder
    _count?: ActivityCountOrderByAggregateInput
    _avg?: ActivityAvgOrderByAggregateInput
    _max?: ActivityMaxOrderByAggregateInput
    _min?: ActivityMinOrderByAggregateInput
    _sum?: ActivitySumOrderByAggregateInput
  }

  export type ActivityScalarWhereWithAggregatesInput = {
    AND?: ActivityScalarWhereWithAggregatesInput | ActivityScalarWhereWithAggregatesInput[]
    OR?: ActivityScalarWhereWithAggregatesInput[]
    NOT?: ActivityScalarWhereWithAggregatesInput | ActivityScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Activity"> | string
    name?: StringWithAggregatesFilter<"Activity"> | string
    weight?: FloatWithAggregatesFilter<"Activity"> | number
    maxScore?: FloatWithAggregatesFilter<"Activity"> | number
    indicatorId?: StringWithAggregatesFilter<"Activity"> | string
  }

  export type GradeEntryWhereInput = {
    AND?: GradeEntryWhereInput | GradeEntryWhereInput[]
    OR?: GradeEntryWhereInput[]
    NOT?: GradeEntryWhereInput | GradeEntryWhereInput[]
    id?: StringFilter<"GradeEntry"> | string
    score?: FloatFilter<"GradeEntry"> | number
    feedback?: StringNullableFilter<"GradeEntry"> | string | null
    userId?: StringFilter<"GradeEntry"> | string
    activityId?: StringFilter<"GradeEntry"> | string
    periodId?: StringFilter<"GradeEntry"> | string
    createdAt?: DateTimeFilter<"GradeEntry"> | Date | string
    updatedAt?: DateTimeFilter<"GradeEntry"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    activity?: XOR<ActivityScalarRelationFilter, ActivityWhereInput>
    period?: XOR<PeriodScalarRelationFilter, PeriodWhereInput>
  }

  export type GradeEntryOrderByWithRelationInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrderInput | SortOrder
    userId?: SortOrder
    activityId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    activity?: ActivityOrderByWithRelationInput
    period?: PeriodOrderByWithRelationInput
  }

  export type GradeEntryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_activityId_periodId?: GradeEntryUserIdActivityIdPeriodIdCompoundUniqueInput
    AND?: GradeEntryWhereInput | GradeEntryWhereInput[]
    OR?: GradeEntryWhereInput[]
    NOT?: GradeEntryWhereInput | GradeEntryWhereInput[]
    score?: FloatFilter<"GradeEntry"> | number
    feedback?: StringNullableFilter<"GradeEntry"> | string | null
    userId?: StringFilter<"GradeEntry"> | string
    activityId?: StringFilter<"GradeEntry"> | string
    periodId?: StringFilter<"GradeEntry"> | string
    createdAt?: DateTimeFilter<"GradeEntry"> | Date | string
    updatedAt?: DateTimeFilter<"GradeEntry"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    activity?: XOR<ActivityScalarRelationFilter, ActivityWhereInput>
    period?: XOR<PeriodScalarRelationFilter, PeriodWhereInput>
  }, "id" | "userId_activityId_periodId">

  export type GradeEntryOrderByWithAggregationInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrderInput | SortOrder
    userId?: SortOrder
    activityId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: GradeEntryCountOrderByAggregateInput
    _avg?: GradeEntryAvgOrderByAggregateInput
    _max?: GradeEntryMaxOrderByAggregateInput
    _min?: GradeEntryMinOrderByAggregateInput
    _sum?: GradeEntrySumOrderByAggregateInput
  }

  export type GradeEntryScalarWhereWithAggregatesInput = {
    AND?: GradeEntryScalarWhereWithAggregatesInput | GradeEntryScalarWhereWithAggregatesInput[]
    OR?: GradeEntryScalarWhereWithAggregatesInput[]
    NOT?: GradeEntryScalarWhereWithAggregatesInput | GradeEntryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"GradeEntry"> | string
    score?: FloatWithAggregatesFilter<"GradeEntry"> | number
    feedback?: StringNullableWithAggregatesFilter<"GradeEntry"> | string | null
    userId?: StringWithAggregatesFilter<"GradeEntry"> | string
    activityId?: StringWithAggregatesFilter<"GradeEntry"> | string
    periodId?: StringWithAggregatesFilter<"GradeEntry"> | string
    createdAt?: DateTimeWithAggregatesFilter<"GradeEntry"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"GradeEntry"> | Date | string
  }

  export type SelfEvaluationWhereInput = {
    AND?: SelfEvaluationWhereInput | SelfEvaluationWhereInput[]
    OR?: SelfEvaluationWhereInput[]
    NOT?: SelfEvaluationWhereInput | SelfEvaluationWhereInput[]
    id?: StringFilter<"SelfEvaluation"> | string
    score?: FloatFilter<"SelfEvaluation"> | number
    feedback?: StringNullableFilter<"SelfEvaluation"> | string | null
    userId?: StringFilter<"SelfEvaluation"> | string
    courseId?: StringFilter<"SelfEvaluation"> | string
    periodId?: StringFilter<"SelfEvaluation"> | string
    createdAt?: DateTimeFilter<"SelfEvaluation"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SelfEvaluationOrderByWithRelationInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrderInput | SortOrder
    userId?: SortOrder
    courseId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type SelfEvaluationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_courseId_periodId?: SelfEvaluationUserIdCourseIdPeriodIdCompoundUniqueInput
    AND?: SelfEvaluationWhereInput | SelfEvaluationWhereInput[]
    OR?: SelfEvaluationWhereInput[]
    NOT?: SelfEvaluationWhereInput | SelfEvaluationWhereInput[]
    score?: FloatFilter<"SelfEvaluation"> | number
    feedback?: StringNullableFilter<"SelfEvaluation"> | string | null
    userId?: StringFilter<"SelfEvaluation"> | string
    courseId?: StringFilter<"SelfEvaluation"> | string
    periodId?: StringFilter<"SelfEvaluation"> | string
    createdAt?: DateTimeFilter<"SelfEvaluation"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId_courseId_periodId">

  export type SelfEvaluationOrderByWithAggregationInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrderInput | SortOrder
    userId?: SortOrder
    courseId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
    _count?: SelfEvaluationCountOrderByAggregateInput
    _avg?: SelfEvaluationAvgOrderByAggregateInput
    _max?: SelfEvaluationMaxOrderByAggregateInput
    _min?: SelfEvaluationMinOrderByAggregateInput
    _sum?: SelfEvaluationSumOrderByAggregateInput
  }

  export type SelfEvaluationScalarWhereWithAggregatesInput = {
    AND?: SelfEvaluationScalarWhereWithAggregatesInput | SelfEvaluationScalarWhereWithAggregatesInput[]
    OR?: SelfEvaluationScalarWhereWithAggregatesInput[]
    NOT?: SelfEvaluationScalarWhereWithAggregatesInput | SelfEvaluationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SelfEvaluation"> | string
    score?: FloatWithAggregatesFilter<"SelfEvaluation"> | number
    feedback?: StringNullableWithAggregatesFilter<"SelfEvaluation"> | string | null
    userId?: StringWithAggregatesFilter<"SelfEvaluation"> | string
    courseId?: StringWithAggregatesFilter<"SelfEvaluation"> | string
    periodId?: StringWithAggregatesFilter<"SelfEvaluation"> | string
    createdAt?: DateTimeWithAggregatesFilter<"SelfEvaluation"> | Date | string
  }

  export type PeerEvaluationWhereInput = {
    AND?: PeerEvaluationWhereInput | PeerEvaluationWhereInput[]
    OR?: PeerEvaluationWhereInput[]
    NOT?: PeerEvaluationWhereInput | PeerEvaluationWhereInput[]
    id?: StringFilter<"PeerEvaluation"> | string
    score?: FloatFilter<"PeerEvaluation"> | number
    feedback?: StringNullableFilter<"PeerEvaluation"> | string | null
    evaluatorId?: StringFilter<"PeerEvaluation"> | string
    evaluatedId?: StringFilter<"PeerEvaluation"> | string
    courseId?: StringFilter<"PeerEvaluation"> | string
    periodId?: StringFilter<"PeerEvaluation"> | string
    createdAt?: DateTimeFilter<"PeerEvaluation"> | Date | string
    evaluator?: XOR<UserScalarRelationFilter, UserWhereInput>
    evaluated?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type PeerEvaluationOrderByWithRelationInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrderInput | SortOrder
    evaluatorId?: SortOrder
    evaluatedId?: SortOrder
    courseId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
    evaluator?: UserOrderByWithRelationInput
    evaluated?: UserOrderByWithRelationInput
  }

  export type PeerEvaluationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    evaluatorId_evaluatedId_courseId_periodId?: PeerEvaluationEvaluatorIdEvaluatedIdCourseIdPeriodIdCompoundUniqueInput
    AND?: PeerEvaluationWhereInput | PeerEvaluationWhereInput[]
    OR?: PeerEvaluationWhereInput[]
    NOT?: PeerEvaluationWhereInput | PeerEvaluationWhereInput[]
    score?: FloatFilter<"PeerEvaluation"> | number
    feedback?: StringNullableFilter<"PeerEvaluation"> | string | null
    evaluatorId?: StringFilter<"PeerEvaluation"> | string
    evaluatedId?: StringFilter<"PeerEvaluation"> | string
    courseId?: StringFilter<"PeerEvaluation"> | string
    periodId?: StringFilter<"PeerEvaluation"> | string
    createdAt?: DateTimeFilter<"PeerEvaluation"> | Date | string
    evaluator?: XOR<UserScalarRelationFilter, UserWhereInput>
    evaluated?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "evaluatorId_evaluatedId_courseId_periodId">

  export type PeerEvaluationOrderByWithAggregationInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrderInput | SortOrder
    evaluatorId?: SortOrder
    evaluatedId?: SortOrder
    courseId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
    _count?: PeerEvaluationCountOrderByAggregateInput
    _avg?: PeerEvaluationAvgOrderByAggregateInput
    _max?: PeerEvaluationMaxOrderByAggregateInput
    _min?: PeerEvaluationMinOrderByAggregateInput
    _sum?: PeerEvaluationSumOrderByAggregateInput
  }

  export type PeerEvaluationScalarWhereWithAggregatesInput = {
    AND?: PeerEvaluationScalarWhereWithAggregatesInput | PeerEvaluationScalarWhereWithAggregatesInput[]
    OR?: PeerEvaluationScalarWhereWithAggregatesInput[]
    NOT?: PeerEvaluationScalarWhereWithAggregatesInput | PeerEvaluationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PeerEvaluation"> | string
    score?: FloatWithAggregatesFilter<"PeerEvaluation"> | number
    feedback?: StringNullableWithAggregatesFilter<"PeerEvaluation"> | string | null
    evaluatorId?: StringWithAggregatesFilter<"PeerEvaluation"> | string
    evaluatedId?: StringWithAggregatesFilter<"PeerEvaluation"> | string
    courseId?: StringWithAggregatesFilter<"PeerEvaluation"> | string
    periodId?: StringWithAggregatesFilter<"PeerEvaluation"> | string
    createdAt?: DateTimeWithAggregatesFilter<"PeerEvaluation"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseCreateNestedManyWithoutTeacherInput
    enrollments?: EnrollmentCreateNestedManyWithoutUserInput
    gradebookEntries?: GradeEntryCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationCreateNestedManyWithoutEvaluatorInput
    peerEvaluationsReceived?: PeerEvaluationCreateNestedManyWithoutEvaluatedInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseUncheckedCreateNestedManyWithoutTeacherInput
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutUserInput
    gradebookEntries?: GradeEntryUncheckedCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationUncheckedCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatorInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatedInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUpdateManyWithoutTeacherNestedInput
    enrollments?: EnrollmentUpdateManyWithoutUserNestedInput
    gradebookEntries?: GradeEntryUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUpdateManyWithoutEvaluatorNestedInput
    peerEvaluationsReceived?: PeerEvaluationUpdateManyWithoutEvaluatedNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUncheckedUpdateManyWithoutTeacherNestedInput
    enrollments?: EnrollmentUncheckedUpdateManyWithoutUserNestedInput
    gradebookEntries?: GradeEntryUncheckedUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUncheckedUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatorNestedInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatedNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseCreateInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacher: UserCreateNestedOneWithoutTeacherCoursesInput
    enrollments?: EnrollmentCreateNestedManyWithoutCourseInput
    classes?: ClassCreateNestedManyWithoutCourseInput
    gradebookStructure?: GradebookStructureCreateNestedOneWithoutCourseInput
    periods?: PeriodCreateNestedManyWithoutCourseInput
  }

  export type CourseUncheckedCreateInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    teacherId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutCourseInput
    classes?: ClassUncheckedCreateNestedManyWithoutCourseInput
    gradebookStructure?: GradebookStructureUncheckedCreateNestedOneWithoutCourseInput
    periods?: PeriodUncheckedCreateNestedManyWithoutCourseInput
  }

  export type CourseUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacher?: UserUpdateOneRequiredWithoutTeacherCoursesNestedInput
    enrollments?: EnrollmentUpdateManyWithoutCourseNestedInput
    classes?: ClassUpdateManyWithoutCourseNestedInput
    gradebookStructure?: GradebookStructureUpdateOneWithoutCourseNestedInput
    periods?: PeriodUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    teacherId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    enrollments?: EnrollmentUncheckedUpdateManyWithoutCourseNestedInput
    classes?: ClassUncheckedUpdateManyWithoutCourseNestedInput
    gradebookStructure?: GradebookStructureUncheckedUpdateOneWithoutCourseNestedInput
    periods?: PeriodUncheckedUpdateManyWithoutCourseNestedInput
  }

  export type CourseCreateManyInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    teacherId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    teacherId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PeriodCreateInput = {
    id?: string
    name: string
    startDate: Date | string
    endDate: Date | string
    isActive?: boolean
    createdAt?: Date | string
    course: CourseCreateNestedOneWithoutPeriodsInput
    gradeEntries?: GradeEntryCreateNestedManyWithoutPeriodInput
  }

  export type PeriodUncheckedCreateInput = {
    id?: string
    name: string
    startDate: Date | string
    endDate: Date | string
    isActive?: boolean
    courseId: string
    createdAt?: Date | string
    gradeEntries?: GradeEntryUncheckedCreateNestedManyWithoutPeriodInput
  }

  export type PeriodUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    course?: CourseUpdateOneRequiredWithoutPeriodsNestedInput
    gradeEntries?: GradeEntryUpdateManyWithoutPeriodNestedInput
  }

  export type PeriodUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    courseId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gradeEntries?: GradeEntryUncheckedUpdateManyWithoutPeriodNestedInput
  }

  export type PeriodCreateManyInput = {
    id?: string
    name: string
    startDate: Date | string
    endDate: Date | string
    isActive?: boolean
    courseId: string
    createdAt?: Date | string
  }

  export type PeriodUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PeriodUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    courseId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EnrollmentCreateInput = {
    id?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutEnrollmentsInput
    course: CourseCreateNestedOneWithoutEnrollmentsInput
  }

  export type EnrollmentUncheckedCreateInput = {
    id?: string
    userId: string
    courseId: string
    createdAt?: Date | string
  }

  export type EnrollmentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutEnrollmentsNestedInput
    course?: CourseUpdateOneRequiredWithoutEnrollmentsNestedInput
  }

  export type EnrollmentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EnrollmentCreateManyInput = {
    id?: string
    userId: string
    courseId: string
    createdAt?: Date | string
  }

  export type EnrollmentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EnrollmentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ClassCreateInput = {
    id?: string
    title: string
    description?: string | null
    code: string
    status?: $Enums.ClassStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    course: CourseCreateNestedOneWithoutClassesInput
    slides?: SlideCreateNestedManyWithoutClassInput
  }

  export type ClassUncheckedCreateInput = {
    id?: string
    title: string
    description?: string | null
    code: string
    status?: $Enums.ClassStatus
    courseId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    slides?: SlideUncheckedCreateNestedManyWithoutClassInput
  }

  export type ClassUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumClassStatusFieldUpdateOperationsInput | $Enums.ClassStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    course?: CourseUpdateOneRequiredWithoutClassesNestedInput
    slides?: SlideUpdateManyWithoutClassNestedInput
  }

  export type ClassUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumClassStatusFieldUpdateOperationsInput | $Enums.ClassStatus
    courseId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    slides?: SlideUncheckedUpdateManyWithoutClassNestedInput
  }

  export type ClassCreateManyInput = {
    id?: string
    title: string
    description?: string | null
    code: string
    status?: $Enums.ClassStatus
    courseId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ClassUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumClassStatusFieldUpdateOperationsInput | $Enums.ClassStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ClassUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumClassStatusFieldUpdateOperationsInput | $Enums.ClassStatus
    courseId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SlideCreateInput = {
    id?: string
    order: number
    type: $Enums.SlideType
    title: string
    content?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    class: ClassCreateNestedOneWithoutSlidesInput
  }

  export type SlideUncheckedCreateInput = {
    id?: string
    order: number
    type: $Enums.SlideType
    title: string
    content?: NullableJsonNullValueInput | InputJsonValue
    classId: string
    createdAt?: Date | string
  }

  export type SlideUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    type?: EnumSlideTypeFieldUpdateOperationsInput | $Enums.SlideType
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    class?: ClassUpdateOneRequiredWithoutSlidesNestedInput
  }

  export type SlideUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    type?: EnumSlideTypeFieldUpdateOperationsInput | $Enums.SlideType
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableJsonNullValueInput | InputJsonValue
    classId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SlideCreateManyInput = {
    id?: string
    order: number
    type: $Enums.SlideType
    title: string
    content?: NullableJsonNullValueInput | InputJsonValue
    classId: string
    createdAt?: Date | string
  }

  export type SlideUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    type?: EnumSlideTypeFieldUpdateOperationsInput | $Enums.SlideType
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SlideUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    type?: EnumSlideTypeFieldUpdateOperationsInput | $Enums.SlideType
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableJsonNullValueInput | InputJsonValue
    classId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GradebookStructureCreateInput = {
    id?: string
    course: CourseCreateNestedOneWithoutGradebookStructureInput
    aspects?: AspectCreateNestedManyWithoutStructureInput
  }

  export type GradebookStructureUncheckedCreateInput = {
    id?: string
    courseId: string
    aspects?: AspectUncheckedCreateNestedManyWithoutStructureInput
  }

  export type GradebookStructureUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    course?: CourseUpdateOneRequiredWithoutGradebookStructureNestedInput
    aspects?: AspectUpdateManyWithoutStructureNestedInput
  }

  export type GradebookStructureUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    aspects?: AspectUncheckedUpdateManyWithoutStructureNestedInput
  }

  export type GradebookStructureCreateManyInput = {
    id?: string
    courseId: string
  }

  export type GradebookStructureUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
  }

  export type GradebookStructureUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
  }

  export type AspectCreateInput = {
    id?: string
    name: string
    weight: number
    structure: GradebookStructureCreateNestedOneWithoutAspectsInput
    indicators?: IndicatorCreateNestedManyWithoutAspectInput
  }

  export type AspectUncheckedCreateInput = {
    id?: string
    name: string
    weight: number
    structureId: string
    indicators?: IndicatorUncheckedCreateNestedManyWithoutAspectInput
  }

  export type AspectUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    structure?: GradebookStructureUpdateOneRequiredWithoutAspectsNestedInput
    indicators?: IndicatorUpdateManyWithoutAspectNestedInput
  }

  export type AspectUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    structureId?: StringFieldUpdateOperationsInput | string
    indicators?: IndicatorUncheckedUpdateManyWithoutAspectNestedInput
  }

  export type AspectCreateManyInput = {
    id?: string
    name: string
    weight: number
    structureId: string
  }

  export type AspectUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
  }

  export type AspectUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    structureId?: StringFieldUpdateOperationsInput | string
  }

  export type IndicatorCreateInput = {
    id?: string
    name: string
    weight: number
    aspect: AspectCreateNestedOneWithoutIndicatorsInput
    activities?: ActivityCreateNestedManyWithoutIndicatorInput
  }

  export type IndicatorUncheckedCreateInput = {
    id?: string
    name: string
    weight: number
    aspectId: string
    activities?: ActivityUncheckedCreateNestedManyWithoutIndicatorInput
  }

  export type IndicatorUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    aspect?: AspectUpdateOneRequiredWithoutIndicatorsNestedInput
    activities?: ActivityUpdateManyWithoutIndicatorNestedInput
  }

  export type IndicatorUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    aspectId?: StringFieldUpdateOperationsInput | string
    activities?: ActivityUncheckedUpdateManyWithoutIndicatorNestedInput
  }

  export type IndicatorCreateManyInput = {
    id?: string
    name: string
    weight: number
    aspectId: string
  }

  export type IndicatorUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
  }

  export type IndicatorUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    aspectId?: StringFieldUpdateOperationsInput | string
  }

  export type ActivityCreateInput = {
    id?: string
    name: string
    weight: number
    maxScore?: number
    indicator: IndicatorCreateNestedOneWithoutActivitiesInput
    gradeEntries?: GradeEntryCreateNestedManyWithoutActivityInput
  }

  export type ActivityUncheckedCreateInput = {
    id?: string
    name: string
    weight: number
    maxScore?: number
    indicatorId: string
    gradeEntries?: GradeEntryUncheckedCreateNestedManyWithoutActivityInput
  }

  export type ActivityUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    maxScore?: FloatFieldUpdateOperationsInput | number
    indicator?: IndicatorUpdateOneRequiredWithoutActivitiesNestedInput
    gradeEntries?: GradeEntryUpdateManyWithoutActivityNestedInput
  }

  export type ActivityUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    maxScore?: FloatFieldUpdateOperationsInput | number
    indicatorId?: StringFieldUpdateOperationsInput | string
    gradeEntries?: GradeEntryUncheckedUpdateManyWithoutActivityNestedInput
  }

  export type ActivityCreateManyInput = {
    id?: string
    name: string
    weight: number
    maxScore?: number
    indicatorId: string
  }

  export type ActivityUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    maxScore?: FloatFieldUpdateOperationsInput | number
  }

  export type ActivityUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    maxScore?: FloatFieldUpdateOperationsInput | number
    indicatorId?: StringFieldUpdateOperationsInput | string
  }

  export type GradeEntryCreateInput = {
    id?: string
    score: number
    feedback?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutGradebookEntriesInput
    activity: ActivityCreateNestedOneWithoutGradeEntriesInput
    period: PeriodCreateNestedOneWithoutGradeEntriesInput
  }

  export type GradeEntryUncheckedCreateInput = {
    id?: string
    score: number
    feedback?: string | null
    userId: string
    activityId: string
    periodId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GradeEntryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutGradebookEntriesNestedInput
    activity?: ActivityUpdateOneRequiredWithoutGradeEntriesNestedInput
    period?: PeriodUpdateOneRequiredWithoutGradeEntriesNestedInput
  }

  export type GradeEntryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    activityId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GradeEntryCreateManyInput = {
    id?: string
    score: number
    feedback?: string | null
    userId: string
    activityId: string
    periodId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GradeEntryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GradeEntryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    activityId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SelfEvaluationCreateInput = {
    id?: string
    score: number
    feedback?: string | null
    courseId: string
    periodId: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutSelfEvaluationsInput
  }

  export type SelfEvaluationUncheckedCreateInput = {
    id?: string
    score: number
    feedback?: string | null
    userId: string
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type SelfEvaluationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSelfEvaluationsNestedInput
  }

  export type SelfEvaluationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SelfEvaluationCreateManyInput = {
    id?: string
    score: number
    feedback?: string | null
    userId: string
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type SelfEvaluationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SelfEvaluationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PeerEvaluationCreateInput = {
    id?: string
    score: number
    feedback?: string | null
    courseId: string
    periodId: string
    createdAt?: Date | string
    evaluator: UserCreateNestedOneWithoutPeerEvaluationsGivenInput
    evaluated: UserCreateNestedOneWithoutPeerEvaluationsReceivedInput
  }

  export type PeerEvaluationUncheckedCreateInput = {
    id?: string
    score: number
    feedback?: string | null
    evaluatorId: string
    evaluatedId: string
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type PeerEvaluationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    evaluator?: UserUpdateOneRequiredWithoutPeerEvaluationsGivenNestedInput
    evaluated?: UserUpdateOneRequiredWithoutPeerEvaluationsReceivedNestedInput
  }

  export type PeerEvaluationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    evaluatorId?: StringFieldUpdateOperationsInput | string
    evaluatedId?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PeerEvaluationCreateManyInput = {
    id?: string
    score: number
    feedback?: string | null
    evaluatorId: string
    evaluatedId: string
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type PeerEvaluationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PeerEvaluationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    evaluatorId?: StringFieldUpdateOperationsInput | string
    evaluatedId?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type CourseListRelationFilter = {
    every?: CourseWhereInput
    some?: CourseWhereInput
    none?: CourseWhereInput
  }

  export type EnrollmentListRelationFilter = {
    every?: EnrollmentWhereInput
    some?: EnrollmentWhereInput
    none?: EnrollmentWhereInput
  }

  export type GradeEntryListRelationFilter = {
    every?: GradeEntryWhereInput
    some?: GradeEntryWhereInput
    none?: GradeEntryWhereInput
  }

  export type SelfEvaluationListRelationFilter = {
    every?: SelfEvaluationWhereInput
    some?: SelfEvaluationWhereInput
    none?: SelfEvaluationWhereInput
  }

  export type PeerEvaluationListRelationFilter = {
    every?: PeerEvaluationWhereInput
    some?: PeerEvaluationWhereInput
    none?: PeerEvaluationWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CourseOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EnrollmentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GradeEntryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SelfEvaluationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PeerEvaluationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    name?: SortOrder
    lastName?: SortOrder
    role?: SortOrder
    avatar?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    name?: SortOrder
    lastName?: SortOrder
    role?: SortOrder
    avatar?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    name?: SortOrder
    lastName?: SortOrder
    role?: SortOrder
    avatar?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type ClassListRelationFilter = {
    every?: ClassWhereInput
    some?: ClassWhereInput
    none?: ClassWhereInput
  }

  export type GradebookStructureNullableScalarRelationFilter = {
    is?: GradebookStructureWhereInput | null
    isNot?: GradebookStructureWhereInput | null
  }

  export type PeriodListRelationFilter = {
    every?: PeriodWhereInput
    some?: PeriodWhereInput
    none?: PeriodWhereInput
  }

  export type ClassOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PeriodOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CourseCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    code?: SortOrder
    isActive?: SortOrder
    teacherId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    code?: SortOrder
    isActive?: SortOrder
    teacherId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    code?: SortOrder
    isActive?: SortOrder
    teacherId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseScalarRelationFilter = {
    is?: CourseWhereInput
    isNot?: CourseWhereInput
  }

  export type PeriodCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isActive?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
  }

  export type PeriodMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isActive?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
  }

  export type PeriodMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isActive?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnrollmentUserIdCourseIdCompoundUniqueInput = {
    userId: string
    courseId: string
  }

  export type EnrollmentCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnrollmentMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnrollmentMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumClassStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ClassStatus | EnumClassStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ClassStatus[] | ListEnumClassStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ClassStatus[] | ListEnumClassStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumClassStatusFilter<$PrismaModel> | $Enums.ClassStatus
  }

  export type SlideListRelationFilter = {
    every?: SlideWhereInput
    some?: SlideWhereInput
    none?: SlideWhereInput
  }

  export type SlideOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ClassCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    code?: SortOrder
    status?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ClassMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    code?: SortOrder
    status?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ClassMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    code?: SortOrder
    status?: SortOrder
    courseId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumClassStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ClassStatus | EnumClassStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ClassStatus[] | ListEnumClassStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ClassStatus[] | ListEnumClassStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumClassStatusWithAggregatesFilter<$PrismaModel> | $Enums.ClassStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumClassStatusFilter<$PrismaModel>
    _max?: NestedEnumClassStatusFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type EnumSlideTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.SlideType | EnumSlideTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SlideType[] | ListEnumSlideTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SlideType[] | ListEnumSlideTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSlideTypeFilter<$PrismaModel> | $Enums.SlideType
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ClassScalarRelationFilter = {
    is?: ClassWhereInput
    isNot?: ClassWhereInput
  }

  export type SlideCountOrderByAggregateInput = {
    id?: SortOrder
    order?: SortOrder
    type?: SortOrder
    title?: SortOrder
    content?: SortOrder
    classId?: SortOrder
    createdAt?: SortOrder
  }

  export type SlideAvgOrderByAggregateInput = {
    order?: SortOrder
  }

  export type SlideMaxOrderByAggregateInput = {
    id?: SortOrder
    order?: SortOrder
    type?: SortOrder
    title?: SortOrder
    classId?: SortOrder
    createdAt?: SortOrder
  }

  export type SlideMinOrderByAggregateInput = {
    id?: SortOrder
    order?: SortOrder
    type?: SortOrder
    title?: SortOrder
    classId?: SortOrder
    createdAt?: SortOrder
  }

  export type SlideSumOrderByAggregateInput = {
    order?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type EnumSlideTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SlideType | EnumSlideTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SlideType[] | ListEnumSlideTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SlideType[] | ListEnumSlideTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSlideTypeWithAggregatesFilter<$PrismaModel> | $Enums.SlideType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSlideTypeFilter<$PrismaModel>
    _max?: NestedEnumSlideTypeFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type AspectListRelationFilter = {
    every?: AspectWhereInput
    some?: AspectWhereInput
    none?: AspectWhereInput
  }

  export type AspectOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GradebookStructureCountOrderByAggregateInput = {
    id?: SortOrder
    courseId?: SortOrder
  }

  export type GradebookStructureMaxOrderByAggregateInput = {
    id?: SortOrder
    courseId?: SortOrder
  }

  export type GradebookStructureMinOrderByAggregateInput = {
    id?: SortOrder
    courseId?: SortOrder
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type GradebookStructureScalarRelationFilter = {
    is?: GradebookStructureWhereInput
    isNot?: GradebookStructureWhereInput
  }

  export type IndicatorListRelationFilter = {
    every?: IndicatorWhereInput
    some?: IndicatorWhereInput
    none?: IndicatorWhereInput
  }

  export type IndicatorOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AspectCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    structureId?: SortOrder
  }

  export type AspectAvgOrderByAggregateInput = {
    weight?: SortOrder
  }

  export type AspectMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    structureId?: SortOrder
  }

  export type AspectMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    structureId?: SortOrder
  }

  export type AspectSumOrderByAggregateInput = {
    weight?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type AspectScalarRelationFilter = {
    is?: AspectWhereInput
    isNot?: AspectWhereInput
  }

  export type ActivityListRelationFilter = {
    every?: ActivityWhereInput
    some?: ActivityWhereInput
    none?: ActivityWhereInput
  }

  export type ActivityOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IndicatorCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    aspectId?: SortOrder
  }

  export type IndicatorAvgOrderByAggregateInput = {
    weight?: SortOrder
  }

  export type IndicatorMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    aspectId?: SortOrder
  }

  export type IndicatorMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    aspectId?: SortOrder
  }

  export type IndicatorSumOrderByAggregateInput = {
    weight?: SortOrder
  }

  export type IndicatorScalarRelationFilter = {
    is?: IndicatorWhereInput
    isNot?: IndicatorWhereInput
  }

  export type ActivityCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    maxScore?: SortOrder
    indicatorId?: SortOrder
  }

  export type ActivityAvgOrderByAggregateInput = {
    weight?: SortOrder
    maxScore?: SortOrder
  }

  export type ActivityMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    maxScore?: SortOrder
    indicatorId?: SortOrder
  }

  export type ActivityMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    weight?: SortOrder
    maxScore?: SortOrder
    indicatorId?: SortOrder
  }

  export type ActivitySumOrderByAggregateInput = {
    weight?: SortOrder
    maxScore?: SortOrder
  }

  export type ActivityScalarRelationFilter = {
    is?: ActivityWhereInput
    isNot?: ActivityWhereInput
  }

  export type PeriodScalarRelationFilter = {
    is?: PeriodWhereInput
    isNot?: PeriodWhereInput
  }

  export type GradeEntryUserIdActivityIdPeriodIdCompoundUniqueInput = {
    userId: string
    activityId: string
    periodId: string
  }

  export type GradeEntryCountOrderByAggregateInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrder
    userId?: SortOrder
    activityId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type GradeEntryAvgOrderByAggregateInput = {
    score?: SortOrder
  }

  export type GradeEntryMaxOrderByAggregateInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrder
    userId?: SortOrder
    activityId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type GradeEntryMinOrderByAggregateInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrder
    userId?: SortOrder
    activityId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type GradeEntrySumOrderByAggregateInput = {
    score?: SortOrder
  }

  export type SelfEvaluationUserIdCourseIdPeriodIdCompoundUniqueInput = {
    userId: string
    courseId: string
    periodId: string
  }

  export type SelfEvaluationCountOrderByAggregateInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrder
    userId?: SortOrder
    courseId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
  }

  export type SelfEvaluationAvgOrderByAggregateInput = {
    score?: SortOrder
  }

  export type SelfEvaluationMaxOrderByAggregateInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrder
    userId?: SortOrder
    courseId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
  }

  export type SelfEvaluationMinOrderByAggregateInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrder
    userId?: SortOrder
    courseId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
  }

  export type SelfEvaluationSumOrderByAggregateInput = {
    score?: SortOrder
  }

  export type PeerEvaluationEvaluatorIdEvaluatedIdCourseIdPeriodIdCompoundUniqueInput = {
    evaluatorId: string
    evaluatedId: string
    courseId: string
    periodId: string
  }

  export type PeerEvaluationCountOrderByAggregateInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrder
    evaluatorId?: SortOrder
    evaluatedId?: SortOrder
    courseId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
  }

  export type PeerEvaluationAvgOrderByAggregateInput = {
    score?: SortOrder
  }

  export type PeerEvaluationMaxOrderByAggregateInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrder
    evaluatorId?: SortOrder
    evaluatedId?: SortOrder
    courseId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
  }

  export type PeerEvaluationMinOrderByAggregateInput = {
    id?: SortOrder
    score?: SortOrder
    feedback?: SortOrder
    evaluatorId?: SortOrder
    evaluatedId?: SortOrder
    courseId?: SortOrder
    periodId?: SortOrder
    createdAt?: SortOrder
  }

  export type PeerEvaluationSumOrderByAggregateInput = {
    score?: SortOrder
  }

  export type CourseCreateNestedManyWithoutTeacherInput = {
    create?: XOR<CourseCreateWithoutTeacherInput, CourseUncheckedCreateWithoutTeacherInput> | CourseCreateWithoutTeacherInput[] | CourseUncheckedCreateWithoutTeacherInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutTeacherInput | CourseCreateOrConnectWithoutTeacherInput[]
    createMany?: CourseCreateManyTeacherInputEnvelope
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
  }

  export type EnrollmentCreateNestedManyWithoutUserInput = {
    create?: XOR<EnrollmentCreateWithoutUserInput, EnrollmentUncheckedCreateWithoutUserInput> | EnrollmentCreateWithoutUserInput[] | EnrollmentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EnrollmentCreateOrConnectWithoutUserInput | EnrollmentCreateOrConnectWithoutUserInput[]
    createMany?: EnrollmentCreateManyUserInputEnvelope
    connect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
  }

  export type GradeEntryCreateNestedManyWithoutUserInput = {
    create?: XOR<GradeEntryCreateWithoutUserInput, GradeEntryUncheckedCreateWithoutUserInput> | GradeEntryCreateWithoutUserInput[] | GradeEntryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutUserInput | GradeEntryCreateOrConnectWithoutUserInput[]
    createMany?: GradeEntryCreateManyUserInputEnvelope
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
  }

  export type SelfEvaluationCreateNestedManyWithoutUserInput = {
    create?: XOR<SelfEvaluationCreateWithoutUserInput, SelfEvaluationUncheckedCreateWithoutUserInput> | SelfEvaluationCreateWithoutUserInput[] | SelfEvaluationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SelfEvaluationCreateOrConnectWithoutUserInput | SelfEvaluationCreateOrConnectWithoutUserInput[]
    createMany?: SelfEvaluationCreateManyUserInputEnvelope
    connect?: SelfEvaluationWhereUniqueInput | SelfEvaluationWhereUniqueInput[]
  }

  export type PeerEvaluationCreateNestedManyWithoutEvaluatorInput = {
    create?: XOR<PeerEvaluationCreateWithoutEvaluatorInput, PeerEvaluationUncheckedCreateWithoutEvaluatorInput> | PeerEvaluationCreateWithoutEvaluatorInput[] | PeerEvaluationUncheckedCreateWithoutEvaluatorInput[]
    connectOrCreate?: PeerEvaluationCreateOrConnectWithoutEvaluatorInput | PeerEvaluationCreateOrConnectWithoutEvaluatorInput[]
    createMany?: PeerEvaluationCreateManyEvaluatorInputEnvelope
    connect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
  }

  export type PeerEvaluationCreateNestedManyWithoutEvaluatedInput = {
    create?: XOR<PeerEvaluationCreateWithoutEvaluatedInput, PeerEvaluationUncheckedCreateWithoutEvaluatedInput> | PeerEvaluationCreateWithoutEvaluatedInput[] | PeerEvaluationUncheckedCreateWithoutEvaluatedInput[]
    connectOrCreate?: PeerEvaluationCreateOrConnectWithoutEvaluatedInput | PeerEvaluationCreateOrConnectWithoutEvaluatedInput[]
    createMany?: PeerEvaluationCreateManyEvaluatedInputEnvelope
    connect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
  }

  export type CourseUncheckedCreateNestedManyWithoutTeacherInput = {
    create?: XOR<CourseCreateWithoutTeacherInput, CourseUncheckedCreateWithoutTeacherInput> | CourseCreateWithoutTeacherInput[] | CourseUncheckedCreateWithoutTeacherInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutTeacherInput | CourseCreateOrConnectWithoutTeacherInput[]
    createMany?: CourseCreateManyTeacherInputEnvelope
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
  }

  export type EnrollmentUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<EnrollmentCreateWithoutUserInput, EnrollmentUncheckedCreateWithoutUserInput> | EnrollmentCreateWithoutUserInput[] | EnrollmentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EnrollmentCreateOrConnectWithoutUserInput | EnrollmentCreateOrConnectWithoutUserInput[]
    createMany?: EnrollmentCreateManyUserInputEnvelope
    connect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
  }

  export type GradeEntryUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<GradeEntryCreateWithoutUserInput, GradeEntryUncheckedCreateWithoutUserInput> | GradeEntryCreateWithoutUserInput[] | GradeEntryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutUserInput | GradeEntryCreateOrConnectWithoutUserInput[]
    createMany?: GradeEntryCreateManyUserInputEnvelope
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
  }

  export type SelfEvaluationUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SelfEvaluationCreateWithoutUserInput, SelfEvaluationUncheckedCreateWithoutUserInput> | SelfEvaluationCreateWithoutUserInput[] | SelfEvaluationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SelfEvaluationCreateOrConnectWithoutUserInput | SelfEvaluationCreateOrConnectWithoutUserInput[]
    createMany?: SelfEvaluationCreateManyUserInputEnvelope
    connect?: SelfEvaluationWhereUniqueInput | SelfEvaluationWhereUniqueInput[]
  }

  export type PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatorInput = {
    create?: XOR<PeerEvaluationCreateWithoutEvaluatorInput, PeerEvaluationUncheckedCreateWithoutEvaluatorInput> | PeerEvaluationCreateWithoutEvaluatorInput[] | PeerEvaluationUncheckedCreateWithoutEvaluatorInput[]
    connectOrCreate?: PeerEvaluationCreateOrConnectWithoutEvaluatorInput | PeerEvaluationCreateOrConnectWithoutEvaluatorInput[]
    createMany?: PeerEvaluationCreateManyEvaluatorInputEnvelope
    connect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
  }

  export type PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatedInput = {
    create?: XOR<PeerEvaluationCreateWithoutEvaluatedInput, PeerEvaluationUncheckedCreateWithoutEvaluatedInput> | PeerEvaluationCreateWithoutEvaluatedInput[] | PeerEvaluationUncheckedCreateWithoutEvaluatedInput[]
    connectOrCreate?: PeerEvaluationCreateOrConnectWithoutEvaluatedInput | PeerEvaluationCreateOrConnectWithoutEvaluatedInput[]
    createMany?: PeerEvaluationCreateManyEvaluatedInputEnvelope
    connect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CourseUpdateManyWithoutTeacherNestedInput = {
    create?: XOR<CourseCreateWithoutTeacherInput, CourseUncheckedCreateWithoutTeacherInput> | CourseCreateWithoutTeacherInput[] | CourseUncheckedCreateWithoutTeacherInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutTeacherInput | CourseCreateOrConnectWithoutTeacherInput[]
    upsert?: CourseUpsertWithWhereUniqueWithoutTeacherInput | CourseUpsertWithWhereUniqueWithoutTeacherInput[]
    createMany?: CourseCreateManyTeacherInputEnvelope
    set?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    disconnect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    delete?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    update?: CourseUpdateWithWhereUniqueWithoutTeacherInput | CourseUpdateWithWhereUniqueWithoutTeacherInput[]
    updateMany?: CourseUpdateManyWithWhereWithoutTeacherInput | CourseUpdateManyWithWhereWithoutTeacherInput[]
    deleteMany?: CourseScalarWhereInput | CourseScalarWhereInput[]
  }

  export type EnrollmentUpdateManyWithoutUserNestedInput = {
    create?: XOR<EnrollmentCreateWithoutUserInput, EnrollmentUncheckedCreateWithoutUserInput> | EnrollmentCreateWithoutUserInput[] | EnrollmentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EnrollmentCreateOrConnectWithoutUserInput | EnrollmentCreateOrConnectWithoutUserInput[]
    upsert?: EnrollmentUpsertWithWhereUniqueWithoutUserInput | EnrollmentUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: EnrollmentCreateManyUserInputEnvelope
    set?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    disconnect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    delete?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    connect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    update?: EnrollmentUpdateWithWhereUniqueWithoutUserInput | EnrollmentUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: EnrollmentUpdateManyWithWhereWithoutUserInput | EnrollmentUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: EnrollmentScalarWhereInput | EnrollmentScalarWhereInput[]
  }

  export type GradeEntryUpdateManyWithoutUserNestedInput = {
    create?: XOR<GradeEntryCreateWithoutUserInput, GradeEntryUncheckedCreateWithoutUserInput> | GradeEntryCreateWithoutUserInput[] | GradeEntryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutUserInput | GradeEntryCreateOrConnectWithoutUserInput[]
    upsert?: GradeEntryUpsertWithWhereUniqueWithoutUserInput | GradeEntryUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: GradeEntryCreateManyUserInputEnvelope
    set?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    disconnect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    delete?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    update?: GradeEntryUpdateWithWhereUniqueWithoutUserInput | GradeEntryUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: GradeEntryUpdateManyWithWhereWithoutUserInput | GradeEntryUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: GradeEntryScalarWhereInput | GradeEntryScalarWhereInput[]
  }

  export type SelfEvaluationUpdateManyWithoutUserNestedInput = {
    create?: XOR<SelfEvaluationCreateWithoutUserInput, SelfEvaluationUncheckedCreateWithoutUserInput> | SelfEvaluationCreateWithoutUserInput[] | SelfEvaluationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SelfEvaluationCreateOrConnectWithoutUserInput | SelfEvaluationCreateOrConnectWithoutUserInput[]
    upsert?: SelfEvaluationUpsertWithWhereUniqueWithoutUserInput | SelfEvaluationUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SelfEvaluationCreateManyUserInputEnvelope
    set?: SelfEvaluationWhereUniqueInput | SelfEvaluationWhereUniqueInput[]
    disconnect?: SelfEvaluationWhereUniqueInput | SelfEvaluationWhereUniqueInput[]
    delete?: SelfEvaluationWhereUniqueInput | SelfEvaluationWhereUniqueInput[]
    connect?: SelfEvaluationWhereUniqueInput | SelfEvaluationWhereUniqueInput[]
    update?: SelfEvaluationUpdateWithWhereUniqueWithoutUserInput | SelfEvaluationUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SelfEvaluationUpdateManyWithWhereWithoutUserInput | SelfEvaluationUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SelfEvaluationScalarWhereInput | SelfEvaluationScalarWhereInput[]
  }

  export type PeerEvaluationUpdateManyWithoutEvaluatorNestedInput = {
    create?: XOR<PeerEvaluationCreateWithoutEvaluatorInput, PeerEvaluationUncheckedCreateWithoutEvaluatorInput> | PeerEvaluationCreateWithoutEvaluatorInput[] | PeerEvaluationUncheckedCreateWithoutEvaluatorInput[]
    connectOrCreate?: PeerEvaluationCreateOrConnectWithoutEvaluatorInput | PeerEvaluationCreateOrConnectWithoutEvaluatorInput[]
    upsert?: PeerEvaluationUpsertWithWhereUniqueWithoutEvaluatorInput | PeerEvaluationUpsertWithWhereUniqueWithoutEvaluatorInput[]
    createMany?: PeerEvaluationCreateManyEvaluatorInputEnvelope
    set?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    disconnect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    delete?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    connect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    update?: PeerEvaluationUpdateWithWhereUniqueWithoutEvaluatorInput | PeerEvaluationUpdateWithWhereUniqueWithoutEvaluatorInput[]
    updateMany?: PeerEvaluationUpdateManyWithWhereWithoutEvaluatorInput | PeerEvaluationUpdateManyWithWhereWithoutEvaluatorInput[]
    deleteMany?: PeerEvaluationScalarWhereInput | PeerEvaluationScalarWhereInput[]
  }

  export type PeerEvaluationUpdateManyWithoutEvaluatedNestedInput = {
    create?: XOR<PeerEvaluationCreateWithoutEvaluatedInput, PeerEvaluationUncheckedCreateWithoutEvaluatedInput> | PeerEvaluationCreateWithoutEvaluatedInput[] | PeerEvaluationUncheckedCreateWithoutEvaluatedInput[]
    connectOrCreate?: PeerEvaluationCreateOrConnectWithoutEvaluatedInput | PeerEvaluationCreateOrConnectWithoutEvaluatedInput[]
    upsert?: PeerEvaluationUpsertWithWhereUniqueWithoutEvaluatedInput | PeerEvaluationUpsertWithWhereUniqueWithoutEvaluatedInput[]
    createMany?: PeerEvaluationCreateManyEvaluatedInputEnvelope
    set?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    disconnect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    delete?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    connect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    update?: PeerEvaluationUpdateWithWhereUniqueWithoutEvaluatedInput | PeerEvaluationUpdateWithWhereUniqueWithoutEvaluatedInput[]
    updateMany?: PeerEvaluationUpdateManyWithWhereWithoutEvaluatedInput | PeerEvaluationUpdateManyWithWhereWithoutEvaluatedInput[]
    deleteMany?: PeerEvaluationScalarWhereInput | PeerEvaluationScalarWhereInput[]
  }

  export type CourseUncheckedUpdateManyWithoutTeacherNestedInput = {
    create?: XOR<CourseCreateWithoutTeacherInput, CourseUncheckedCreateWithoutTeacherInput> | CourseCreateWithoutTeacherInput[] | CourseUncheckedCreateWithoutTeacherInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutTeacherInput | CourseCreateOrConnectWithoutTeacherInput[]
    upsert?: CourseUpsertWithWhereUniqueWithoutTeacherInput | CourseUpsertWithWhereUniqueWithoutTeacherInput[]
    createMany?: CourseCreateManyTeacherInputEnvelope
    set?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    disconnect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    delete?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    update?: CourseUpdateWithWhereUniqueWithoutTeacherInput | CourseUpdateWithWhereUniqueWithoutTeacherInput[]
    updateMany?: CourseUpdateManyWithWhereWithoutTeacherInput | CourseUpdateManyWithWhereWithoutTeacherInput[]
    deleteMany?: CourseScalarWhereInput | CourseScalarWhereInput[]
  }

  export type EnrollmentUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<EnrollmentCreateWithoutUserInput, EnrollmentUncheckedCreateWithoutUserInput> | EnrollmentCreateWithoutUserInput[] | EnrollmentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EnrollmentCreateOrConnectWithoutUserInput | EnrollmentCreateOrConnectWithoutUserInput[]
    upsert?: EnrollmentUpsertWithWhereUniqueWithoutUserInput | EnrollmentUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: EnrollmentCreateManyUserInputEnvelope
    set?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    disconnect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    delete?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    connect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    update?: EnrollmentUpdateWithWhereUniqueWithoutUserInput | EnrollmentUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: EnrollmentUpdateManyWithWhereWithoutUserInput | EnrollmentUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: EnrollmentScalarWhereInput | EnrollmentScalarWhereInput[]
  }

  export type GradeEntryUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<GradeEntryCreateWithoutUserInput, GradeEntryUncheckedCreateWithoutUserInput> | GradeEntryCreateWithoutUserInput[] | GradeEntryUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutUserInput | GradeEntryCreateOrConnectWithoutUserInput[]
    upsert?: GradeEntryUpsertWithWhereUniqueWithoutUserInput | GradeEntryUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: GradeEntryCreateManyUserInputEnvelope
    set?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    disconnect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    delete?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    update?: GradeEntryUpdateWithWhereUniqueWithoutUserInput | GradeEntryUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: GradeEntryUpdateManyWithWhereWithoutUserInput | GradeEntryUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: GradeEntryScalarWhereInput | GradeEntryScalarWhereInput[]
  }

  export type SelfEvaluationUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SelfEvaluationCreateWithoutUserInput, SelfEvaluationUncheckedCreateWithoutUserInput> | SelfEvaluationCreateWithoutUserInput[] | SelfEvaluationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SelfEvaluationCreateOrConnectWithoutUserInput | SelfEvaluationCreateOrConnectWithoutUserInput[]
    upsert?: SelfEvaluationUpsertWithWhereUniqueWithoutUserInput | SelfEvaluationUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SelfEvaluationCreateManyUserInputEnvelope
    set?: SelfEvaluationWhereUniqueInput | SelfEvaluationWhereUniqueInput[]
    disconnect?: SelfEvaluationWhereUniqueInput | SelfEvaluationWhereUniqueInput[]
    delete?: SelfEvaluationWhereUniqueInput | SelfEvaluationWhereUniqueInput[]
    connect?: SelfEvaluationWhereUniqueInput | SelfEvaluationWhereUniqueInput[]
    update?: SelfEvaluationUpdateWithWhereUniqueWithoutUserInput | SelfEvaluationUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SelfEvaluationUpdateManyWithWhereWithoutUserInput | SelfEvaluationUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SelfEvaluationScalarWhereInput | SelfEvaluationScalarWhereInput[]
  }

  export type PeerEvaluationUncheckedUpdateManyWithoutEvaluatorNestedInput = {
    create?: XOR<PeerEvaluationCreateWithoutEvaluatorInput, PeerEvaluationUncheckedCreateWithoutEvaluatorInput> | PeerEvaluationCreateWithoutEvaluatorInput[] | PeerEvaluationUncheckedCreateWithoutEvaluatorInput[]
    connectOrCreate?: PeerEvaluationCreateOrConnectWithoutEvaluatorInput | PeerEvaluationCreateOrConnectWithoutEvaluatorInput[]
    upsert?: PeerEvaluationUpsertWithWhereUniqueWithoutEvaluatorInput | PeerEvaluationUpsertWithWhereUniqueWithoutEvaluatorInput[]
    createMany?: PeerEvaluationCreateManyEvaluatorInputEnvelope
    set?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    disconnect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    delete?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    connect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    update?: PeerEvaluationUpdateWithWhereUniqueWithoutEvaluatorInput | PeerEvaluationUpdateWithWhereUniqueWithoutEvaluatorInput[]
    updateMany?: PeerEvaluationUpdateManyWithWhereWithoutEvaluatorInput | PeerEvaluationUpdateManyWithWhereWithoutEvaluatorInput[]
    deleteMany?: PeerEvaluationScalarWhereInput | PeerEvaluationScalarWhereInput[]
  }

  export type PeerEvaluationUncheckedUpdateManyWithoutEvaluatedNestedInput = {
    create?: XOR<PeerEvaluationCreateWithoutEvaluatedInput, PeerEvaluationUncheckedCreateWithoutEvaluatedInput> | PeerEvaluationCreateWithoutEvaluatedInput[] | PeerEvaluationUncheckedCreateWithoutEvaluatedInput[]
    connectOrCreate?: PeerEvaluationCreateOrConnectWithoutEvaluatedInput | PeerEvaluationCreateOrConnectWithoutEvaluatedInput[]
    upsert?: PeerEvaluationUpsertWithWhereUniqueWithoutEvaluatedInput | PeerEvaluationUpsertWithWhereUniqueWithoutEvaluatedInput[]
    createMany?: PeerEvaluationCreateManyEvaluatedInputEnvelope
    set?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    disconnect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    delete?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    connect?: PeerEvaluationWhereUniqueInput | PeerEvaluationWhereUniqueInput[]
    update?: PeerEvaluationUpdateWithWhereUniqueWithoutEvaluatedInput | PeerEvaluationUpdateWithWhereUniqueWithoutEvaluatedInput[]
    updateMany?: PeerEvaluationUpdateManyWithWhereWithoutEvaluatedInput | PeerEvaluationUpdateManyWithWhereWithoutEvaluatedInput[]
    deleteMany?: PeerEvaluationScalarWhereInput | PeerEvaluationScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutTeacherCoursesInput = {
    create?: XOR<UserCreateWithoutTeacherCoursesInput, UserUncheckedCreateWithoutTeacherCoursesInput>
    connectOrCreate?: UserCreateOrConnectWithoutTeacherCoursesInput
    connect?: UserWhereUniqueInput
  }

  export type EnrollmentCreateNestedManyWithoutCourseInput = {
    create?: XOR<EnrollmentCreateWithoutCourseInput, EnrollmentUncheckedCreateWithoutCourseInput> | EnrollmentCreateWithoutCourseInput[] | EnrollmentUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: EnrollmentCreateOrConnectWithoutCourseInput | EnrollmentCreateOrConnectWithoutCourseInput[]
    createMany?: EnrollmentCreateManyCourseInputEnvelope
    connect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
  }

  export type ClassCreateNestedManyWithoutCourseInput = {
    create?: XOR<ClassCreateWithoutCourseInput, ClassUncheckedCreateWithoutCourseInput> | ClassCreateWithoutCourseInput[] | ClassUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: ClassCreateOrConnectWithoutCourseInput | ClassCreateOrConnectWithoutCourseInput[]
    createMany?: ClassCreateManyCourseInputEnvelope
    connect?: ClassWhereUniqueInput | ClassWhereUniqueInput[]
  }

  export type GradebookStructureCreateNestedOneWithoutCourseInput = {
    create?: XOR<GradebookStructureCreateWithoutCourseInput, GradebookStructureUncheckedCreateWithoutCourseInput>
    connectOrCreate?: GradebookStructureCreateOrConnectWithoutCourseInput
    connect?: GradebookStructureWhereUniqueInput
  }

  export type PeriodCreateNestedManyWithoutCourseInput = {
    create?: XOR<PeriodCreateWithoutCourseInput, PeriodUncheckedCreateWithoutCourseInput> | PeriodCreateWithoutCourseInput[] | PeriodUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: PeriodCreateOrConnectWithoutCourseInput | PeriodCreateOrConnectWithoutCourseInput[]
    createMany?: PeriodCreateManyCourseInputEnvelope
    connect?: PeriodWhereUniqueInput | PeriodWhereUniqueInput[]
  }

  export type EnrollmentUncheckedCreateNestedManyWithoutCourseInput = {
    create?: XOR<EnrollmentCreateWithoutCourseInput, EnrollmentUncheckedCreateWithoutCourseInput> | EnrollmentCreateWithoutCourseInput[] | EnrollmentUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: EnrollmentCreateOrConnectWithoutCourseInput | EnrollmentCreateOrConnectWithoutCourseInput[]
    createMany?: EnrollmentCreateManyCourseInputEnvelope
    connect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
  }

  export type ClassUncheckedCreateNestedManyWithoutCourseInput = {
    create?: XOR<ClassCreateWithoutCourseInput, ClassUncheckedCreateWithoutCourseInput> | ClassCreateWithoutCourseInput[] | ClassUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: ClassCreateOrConnectWithoutCourseInput | ClassCreateOrConnectWithoutCourseInput[]
    createMany?: ClassCreateManyCourseInputEnvelope
    connect?: ClassWhereUniqueInput | ClassWhereUniqueInput[]
  }

  export type GradebookStructureUncheckedCreateNestedOneWithoutCourseInput = {
    create?: XOR<GradebookStructureCreateWithoutCourseInput, GradebookStructureUncheckedCreateWithoutCourseInput>
    connectOrCreate?: GradebookStructureCreateOrConnectWithoutCourseInput
    connect?: GradebookStructureWhereUniqueInput
  }

  export type PeriodUncheckedCreateNestedManyWithoutCourseInput = {
    create?: XOR<PeriodCreateWithoutCourseInput, PeriodUncheckedCreateWithoutCourseInput> | PeriodCreateWithoutCourseInput[] | PeriodUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: PeriodCreateOrConnectWithoutCourseInput | PeriodCreateOrConnectWithoutCourseInput[]
    createMany?: PeriodCreateManyCourseInputEnvelope
    connect?: PeriodWhereUniqueInput | PeriodWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutTeacherCoursesNestedInput = {
    create?: XOR<UserCreateWithoutTeacherCoursesInput, UserUncheckedCreateWithoutTeacherCoursesInput>
    connectOrCreate?: UserCreateOrConnectWithoutTeacherCoursesInput
    upsert?: UserUpsertWithoutTeacherCoursesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutTeacherCoursesInput, UserUpdateWithoutTeacherCoursesInput>, UserUncheckedUpdateWithoutTeacherCoursesInput>
  }

  export type EnrollmentUpdateManyWithoutCourseNestedInput = {
    create?: XOR<EnrollmentCreateWithoutCourseInput, EnrollmentUncheckedCreateWithoutCourseInput> | EnrollmentCreateWithoutCourseInput[] | EnrollmentUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: EnrollmentCreateOrConnectWithoutCourseInput | EnrollmentCreateOrConnectWithoutCourseInput[]
    upsert?: EnrollmentUpsertWithWhereUniqueWithoutCourseInput | EnrollmentUpsertWithWhereUniqueWithoutCourseInput[]
    createMany?: EnrollmentCreateManyCourseInputEnvelope
    set?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    disconnect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    delete?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    connect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    update?: EnrollmentUpdateWithWhereUniqueWithoutCourseInput | EnrollmentUpdateWithWhereUniqueWithoutCourseInput[]
    updateMany?: EnrollmentUpdateManyWithWhereWithoutCourseInput | EnrollmentUpdateManyWithWhereWithoutCourseInput[]
    deleteMany?: EnrollmentScalarWhereInput | EnrollmentScalarWhereInput[]
  }

  export type ClassUpdateManyWithoutCourseNestedInput = {
    create?: XOR<ClassCreateWithoutCourseInput, ClassUncheckedCreateWithoutCourseInput> | ClassCreateWithoutCourseInput[] | ClassUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: ClassCreateOrConnectWithoutCourseInput | ClassCreateOrConnectWithoutCourseInput[]
    upsert?: ClassUpsertWithWhereUniqueWithoutCourseInput | ClassUpsertWithWhereUniqueWithoutCourseInput[]
    createMany?: ClassCreateManyCourseInputEnvelope
    set?: ClassWhereUniqueInput | ClassWhereUniqueInput[]
    disconnect?: ClassWhereUniqueInput | ClassWhereUniqueInput[]
    delete?: ClassWhereUniqueInput | ClassWhereUniqueInput[]
    connect?: ClassWhereUniqueInput | ClassWhereUniqueInput[]
    update?: ClassUpdateWithWhereUniqueWithoutCourseInput | ClassUpdateWithWhereUniqueWithoutCourseInput[]
    updateMany?: ClassUpdateManyWithWhereWithoutCourseInput | ClassUpdateManyWithWhereWithoutCourseInput[]
    deleteMany?: ClassScalarWhereInput | ClassScalarWhereInput[]
  }

  export type GradebookStructureUpdateOneWithoutCourseNestedInput = {
    create?: XOR<GradebookStructureCreateWithoutCourseInput, GradebookStructureUncheckedCreateWithoutCourseInput>
    connectOrCreate?: GradebookStructureCreateOrConnectWithoutCourseInput
    upsert?: GradebookStructureUpsertWithoutCourseInput
    disconnect?: GradebookStructureWhereInput | boolean
    delete?: GradebookStructureWhereInput | boolean
    connect?: GradebookStructureWhereUniqueInput
    update?: XOR<XOR<GradebookStructureUpdateToOneWithWhereWithoutCourseInput, GradebookStructureUpdateWithoutCourseInput>, GradebookStructureUncheckedUpdateWithoutCourseInput>
  }

  export type PeriodUpdateManyWithoutCourseNestedInput = {
    create?: XOR<PeriodCreateWithoutCourseInput, PeriodUncheckedCreateWithoutCourseInput> | PeriodCreateWithoutCourseInput[] | PeriodUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: PeriodCreateOrConnectWithoutCourseInput | PeriodCreateOrConnectWithoutCourseInput[]
    upsert?: PeriodUpsertWithWhereUniqueWithoutCourseInput | PeriodUpsertWithWhereUniqueWithoutCourseInput[]
    createMany?: PeriodCreateManyCourseInputEnvelope
    set?: PeriodWhereUniqueInput | PeriodWhereUniqueInput[]
    disconnect?: PeriodWhereUniqueInput | PeriodWhereUniqueInput[]
    delete?: PeriodWhereUniqueInput | PeriodWhereUniqueInput[]
    connect?: PeriodWhereUniqueInput | PeriodWhereUniqueInput[]
    update?: PeriodUpdateWithWhereUniqueWithoutCourseInput | PeriodUpdateWithWhereUniqueWithoutCourseInput[]
    updateMany?: PeriodUpdateManyWithWhereWithoutCourseInput | PeriodUpdateManyWithWhereWithoutCourseInput[]
    deleteMany?: PeriodScalarWhereInput | PeriodScalarWhereInput[]
  }

  export type EnrollmentUncheckedUpdateManyWithoutCourseNestedInput = {
    create?: XOR<EnrollmentCreateWithoutCourseInput, EnrollmentUncheckedCreateWithoutCourseInput> | EnrollmentCreateWithoutCourseInput[] | EnrollmentUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: EnrollmentCreateOrConnectWithoutCourseInput | EnrollmentCreateOrConnectWithoutCourseInput[]
    upsert?: EnrollmentUpsertWithWhereUniqueWithoutCourseInput | EnrollmentUpsertWithWhereUniqueWithoutCourseInput[]
    createMany?: EnrollmentCreateManyCourseInputEnvelope
    set?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    disconnect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    delete?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    connect?: EnrollmentWhereUniqueInput | EnrollmentWhereUniqueInput[]
    update?: EnrollmentUpdateWithWhereUniqueWithoutCourseInput | EnrollmentUpdateWithWhereUniqueWithoutCourseInput[]
    updateMany?: EnrollmentUpdateManyWithWhereWithoutCourseInput | EnrollmentUpdateManyWithWhereWithoutCourseInput[]
    deleteMany?: EnrollmentScalarWhereInput | EnrollmentScalarWhereInput[]
  }

  export type ClassUncheckedUpdateManyWithoutCourseNestedInput = {
    create?: XOR<ClassCreateWithoutCourseInput, ClassUncheckedCreateWithoutCourseInput> | ClassCreateWithoutCourseInput[] | ClassUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: ClassCreateOrConnectWithoutCourseInput | ClassCreateOrConnectWithoutCourseInput[]
    upsert?: ClassUpsertWithWhereUniqueWithoutCourseInput | ClassUpsertWithWhereUniqueWithoutCourseInput[]
    createMany?: ClassCreateManyCourseInputEnvelope
    set?: ClassWhereUniqueInput | ClassWhereUniqueInput[]
    disconnect?: ClassWhereUniqueInput | ClassWhereUniqueInput[]
    delete?: ClassWhereUniqueInput | ClassWhereUniqueInput[]
    connect?: ClassWhereUniqueInput | ClassWhereUniqueInput[]
    update?: ClassUpdateWithWhereUniqueWithoutCourseInput | ClassUpdateWithWhereUniqueWithoutCourseInput[]
    updateMany?: ClassUpdateManyWithWhereWithoutCourseInput | ClassUpdateManyWithWhereWithoutCourseInput[]
    deleteMany?: ClassScalarWhereInput | ClassScalarWhereInput[]
  }

  export type GradebookStructureUncheckedUpdateOneWithoutCourseNestedInput = {
    create?: XOR<GradebookStructureCreateWithoutCourseInput, GradebookStructureUncheckedCreateWithoutCourseInput>
    connectOrCreate?: GradebookStructureCreateOrConnectWithoutCourseInput
    upsert?: GradebookStructureUpsertWithoutCourseInput
    disconnect?: GradebookStructureWhereInput | boolean
    delete?: GradebookStructureWhereInput | boolean
    connect?: GradebookStructureWhereUniqueInput
    update?: XOR<XOR<GradebookStructureUpdateToOneWithWhereWithoutCourseInput, GradebookStructureUpdateWithoutCourseInput>, GradebookStructureUncheckedUpdateWithoutCourseInput>
  }

  export type PeriodUncheckedUpdateManyWithoutCourseNestedInput = {
    create?: XOR<PeriodCreateWithoutCourseInput, PeriodUncheckedCreateWithoutCourseInput> | PeriodCreateWithoutCourseInput[] | PeriodUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: PeriodCreateOrConnectWithoutCourseInput | PeriodCreateOrConnectWithoutCourseInput[]
    upsert?: PeriodUpsertWithWhereUniqueWithoutCourseInput | PeriodUpsertWithWhereUniqueWithoutCourseInput[]
    createMany?: PeriodCreateManyCourseInputEnvelope
    set?: PeriodWhereUniqueInput | PeriodWhereUniqueInput[]
    disconnect?: PeriodWhereUniqueInput | PeriodWhereUniqueInput[]
    delete?: PeriodWhereUniqueInput | PeriodWhereUniqueInput[]
    connect?: PeriodWhereUniqueInput | PeriodWhereUniqueInput[]
    update?: PeriodUpdateWithWhereUniqueWithoutCourseInput | PeriodUpdateWithWhereUniqueWithoutCourseInput[]
    updateMany?: PeriodUpdateManyWithWhereWithoutCourseInput | PeriodUpdateManyWithWhereWithoutCourseInput[]
    deleteMany?: PeriodScalarWhereInput | PeriodScalarWhereInput[]
  }

  export type CourseCreateNestedOneWithoutPeriodsInput = {
    create?: XOR<CourseCreateWithoutPeriodsInput, CourseUncheckedCreateWithoutPeriodsInput>
    connectOrCreate?: CourseCreateOrConnectWithoutPeriodsInput
    connect?: CourseWhereUniqueInput
  }

  export type GradeEntryCreateNestedManyWithoutPeriodInput = {
    create?: XOR<GradeEntryCreateWithoutPeriodInput, GradeEntryUncheckedCreateWithoutPeriodInput> | GradeEntryCreateWithoutPeriodInput[] | GradeEntryUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutPeriodInput | GradeEntryCreateOrConnectWithoutPeriodInput[]
    createMany?: GradeEntryCreateManyPeriodInputEnvelope
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
  }

  export type GradeEntryUncheckedCreateNestedManyWithoutPeriodInput = {
    create?: XOR<GradeEntryCreateWithoutPeriodInput, GradeEntryUncheckedCreateWithoutPeriodInput> | GradeEntryCreateWithoutPeriodInput[] | GradeEntryUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutPeriodInput | GradeEntryCreateOrConnectWithoutPeriodInput[]
    createMany?: GradeEntryCreateManyPeriodInputEnvelope
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
  }

  export type CourseUpdateOneRequiredWithoutPeriodsNestedInput = {
    create?: XOR<CourseCreateWithoutPeriodsInput, CourseUncheckedCreateWithoutPeriodsInput>
    connectOrCreate?: CourseCreateOrConnectWithoutPeriodsInput
    upsert?: CourseUpsertWithoutPeriodsInput
    connect?: CourseWhereUniqueInput
    update?: XOR<XOR<CourseUpdateToOneWithWhereWithoutPeriodsInput, CourseUpdateWithoutPeriodsInput>, CourseUncheckedUpdateWithoutPeriodsInput>
  }

  export type GradeEntryUpdateManyWithoutPeriodNestedInput = {
    create?: XOR<GradeEntryCreateWithoutPeriodInput, GradeEntryUncheckedCreateWithoutPeriodInput> | GradeEntryCreateWithoutPeriodInput[] | GradeEntryUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutPeriodInput | GradeEntryCreateOrConnectWithoutPeriodInput[]
    upsert?: GradeEntryUpsertWithWhereUniqueWithoutPeriodInput | GradeEntryUpsertWithWhereUniqueWithoutPeriodInput[]
    createMany?: GradeEntryCreateManyPeriodInputEnvelope
    set?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    disconnect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    delete?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    update?: GradeEntryUpdateWithWhereUniqueWithoutPeriodInput | GradeEntryUpdateWithWhereUniqueWithoutPeriodInput[]
    updateMany?: GradeEntryUpdateManyWithWhereWithoutPeriodInput | GradeEntryUpdateManyWithWhereWithoutPeriodInput[]
    deleteMany?: GradeEntryScalarWhereInput | GradeEntryScalarWhereInput[]
  }

  export type GradeEntryUncheckedUpdateManyWithoutPeriodNestedInput = {
    create?: XOR<GradeEntryCreateWithoutPeriodInput, GradeEntryUncheckedCreateWithoutPeriodInput> | GradeEntryCreateWithoutPeriodInput[] | GradeEntryUncheckedCreateWithoutPeriodInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutPeriodInput | GradeEntryCreateOrConnectWithoutPeriodInput[]
    upsert?: GradeEntryUpsertWithWhereUniqueWithoutPeriodInput | GradeEntryUpsertWithWhereUniqueWithoutPeriodInput[]
    createMany?: GradeEntryCreateManyPeriodInputEnvelope
    set?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    disconnect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    delete?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    update?: GradeEntryUpdateWithWhereUniqueWithoutPeriodInput | GradeEntryUpdateWithWhereUniqueWithoutPeriodInput[]
    updateMany?: GradeEntryUpdateManyWithWhereWithoutPeriodInput | GradeEntryUpdateManyWithWhereWithoutPeriodInput[]
    deleteMany?: GradeEntryScalarWhereInput | GradeEntryScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutEnrollmentsInput = {
    create?: XOR<UserCreateWithoutEnrollmentsInput, UserUncheckedCreateWithoutEnrollmentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutEnrollmentsInput
    connect?: UserWhereUniqueInput
  }

  export type CourseCreateNestedOneWithoutEnrollmentsInput = {
    create?: XOR<CourseCreateWithoutEnrollmentsInput, CourseUncheckedCreateWithoutEnrollmentsInput>
    connectOrCreate?: CourseCreateOrConnectWithoutEnrollmentsInput
    connect?: CourseWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutEnrollmentsNestedInput = {
    create?: XOR<UserCreateWithoutEnrollmentsInput, UserUncheckedCreateWithoutEnrollmentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutEnrollmentsInput
    upsert?: UserUpsertWithoutEnrollmentsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutEnrollmentsInput, UserUpdateWithoutEnrollmentsInput>, UserUncheckedUpdateWithoutEnrollmentsInput>
  }

  export type CourseUpdateOneRequiredWithoutEnrollmentsNestedInput = {
    create?: XOR<CourseCreateWithoutEnrollmentsInput, CourseUncheckedCreateWithoutEnrollmentsInput>
    connectOrCreate?: CourseCreateOrConnectWithoutEnrollmentsInput
    upsert?: CourseUpsertWithoutEnrollmentsInput
    connect?: CourseWhereUniqueInput
    update?: XOR<XOR<CourseUpdateToOneWithWhereWithoutEnrollmentsInput, CourseUpdateWithoutEnrollmentsInput>, CourseUncheckedUpdateWithoutEnrollmentsInput>
  }

  export type CourseCreateNestedOneWithoutClassesInput = {
    create?: XOR<CourseCreateWithoutClassesInput, CourseUncheckedCreateWithoutClassesInput>
    connectOrCreate?: CourseCreateOrConnectWithoutClassesInput
    connect?: CourseWhereUniqueInput
  }

  export type SlideCreateNestedManyWithoutClassInput = {
    create?: XOR<SlideCreateWithoutClassInput, SlideUncheckedCreateWithoutClassInput> | SlideCreateWithoutClassInput[] | SlideUncheckedCreateWithoutClassInput[]
    connectOrCreate?: SlideCreateOrConnectWithoutClassInput | SlideCreateOrConnectWithoutClassInput[]
    createMany?: SlideCreateManyClassInputEnvelope
    connect?: SlideWhereUniqueInput | SlideWhereUniqueInput[]
  }

  export type SlideUncheckedCreateNestedManyWithoutClassInput = {
    create?: XOR<SlideCreateWithoutClassInput, SlideUncheckedCreateWithoutClassInput> | SlideCreateWithoutClassInput[] | SlideUncheckedCreateWithoutClassInput[]
    connectOrCreate?: SlideCreateOrConnectWithoutClassInput | SlideCreateOrConnectWithoutClassInput[]
    createMany?: SlideCreateManyClassInputEnvelope
    connect?: SlideWhereUniqueInput | SlideWhereUniqueInput[]
  }

  export type EnumClassStatusFieldUpdateOperationsInput = {
    set?: $Enums.ClassStatus
  }

  export type CourseUpdateOneRequiredWithoutClassesNestedInput = {
    create?: XOR<CourseCreateWithoutClassesInput, CourseUncheckedCreateWithoutClassesInput>
    connectOrCreate?: CourseCreateOrConnectWithoutClassesInput
    upsert?: CourseUpsertWithoutClassesInput
    connect?: CourseWhereUniqueInput
    update?: XOR<XOR<CourseUpdateToOneWithWhereWithoutClassesInput, CourseUpdateWithoutClassesInput>, CourseUncheckedUpdateWithoutClassesInput>
  }

  export type SlideUpdateManyWithoutClassNestedInput = {
    create?: XOR<SlideCreateWithoutClassInput, SlideUncheckedCreateWithoutClassInput> | SlideCreateWithoutClassInput[] | SlideUncheckedCreateWithoutClassInput[]
    connectOrCreate?: SlideCreateOrConnectWithoutClassInput | SlideCreateOrConnectWithoutClassInput[]
    upsert?: SlideUpsertWithWhereUniqueWithoutClassInput | SlideUpsertWithWhereUniqueWithoutClassInput[]
    createMany?: SlideCreateManyClassInputEnvelope
    set?: SlideWhereUniqueInput | SlideWhereUniqueInput[]
    disconnect?: SlideWhereUniqueInput | SlideWhereUniqueInput[]
    delete?: SlideWhereUniqueInput | SlideWhereUniqueInput[]
    connect?: SlideWhereUniqueInput | SlideWhereUniqueInput[]
    update?: SlideUpdateWithWhereUniqueWithoutClassInput | SlideUpdateWithWhereUniqueWithoutClassInput[]
    updateMany?: SlideUpdateManyWithWhereWithoutClassInput | SlideUpdateManyWithWhereWithoutClassInput[]
    deleteMany?: SlideScalarWhereInput | SlideScalarWhereInput[]
  }

  export type SlideUncheckedUpdateManyWithoutClassNestedInput = {
    create?: XOR<SlideCreateWithoutClassInput, SlideUncheckedCreateWithoutClassInput> | SlideCreateWithoutClassInput[] | SlideUncheckedCreateWithoutClassInput[]
    connectOrCreate?: SlideCreateOrConnectWithoutClassInput | SlideCreateOrConnectWithoutClassInput[]
    upsert?: SlideUpsertWithWhereUniqueWithoutClassInput | SlideUpsertWithWhereUniqueWithoutClassInput[]
    createMany?: SlideCreateManyClassInputEnvelope
    set?: SlideWhereUniqueInput | SlideWhereUniqueInput[]
    disconnect?: SlideWhereUniqueInput | SlideWhereUniqueInput[]
    delete?: SlideWhereUniqueInput | SlideWhereUniqueInput[]
    connect?: SlideWhereUniqueInput | SlideWhereUniqueInput[]
    update?: SlideUpdateWithWhereUniqueWithoutClassInput | SlideUpdateWithWhereUniqueWithoutClassInput[]
    updateMany?: SlideUpdateManyWithWhereWithoutClassInput | SlideUpdateManyWithWhereWithoutClassInput[]
    deleteMany?: SlideScalarWhereInput | SlideScalarWhereInput[]
  }

  export type ClassCreateNestedOneWithoutSlidesInput = {
    create?: XOR<ClassCreateWithoutSlidesInput, ClassUncheckedCreateWithoutSlidesInput>
    connectOrCreate?: ClassCreateOrConnectWithoutSlidesInput
    connect?: ClassWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumSlideTypeFieldUpdateOperationsInput = {
    set?: $Enums.SlideType
  }

  export type ClassUpdateOneRequiredWithoutSlidesNestedInput = {
    create?: XOR<ClassCreateWithoutSlidesInput, ClassUncheckedCreateWithoutSlidesInput>
    connectOrCreate?: ClassCreateOrConnectWithoutSlidesInput
    upsert?: ClassUpsertWithoutSlidesInput
    connect?: ClassWhereUniqueInput
    update?: XOR<XOR<ClassUpdateToOneWithWhereWithoutSlidesInput, ClassUpdateWithoutSlidesInput>, ClassUncheckedUpdateWithoutSlidesInput>
  }

  export type CourseCreateNestedOneWithoutGradebookStructureInput = {
    create?: XOR<CourseCreateWithoutGradebookStructureInput, CourseUncheckedCreateWithoutGradebookStructureInput>
    connectOrCreate?: CourseCreateOrConnectWithoutGradebookStructureInput
    connect?: CourseWhereUniqueInput
  }

  export type AspectCreateNestedManyWithoutStructureInput = {
    create?: XOR<AspectCreateWithoutStructureInput, AspectUncheckedCreateWithoutStructureInput> | AspectCreateWithoutStructureInput[] | AspectUncheckedCreateWithoutStructureInput[]
    connectOrCreate?: AspectCreateOrConnectWithoutStructureInput | AspectCreateOrConnectWithoutStructureInput[]
    createMany?: AspectCreateManyStructureInputEnvelope
    connect?: AspectWhereUniqueInput | AspectWhereUniqueInput[]
  }

  export type AspectUncheckedCreateNestedManyWithoutStructureInput = {
    create?: XOR<AspectCreateWithoutStructureInput, AspectUncheckedCreateWithoutStructureInput> | AspectCreateWithoutStructureInput[] | AspectUncheckedCreateWithoutStructureInput[]
    connectOrCreate?: AspectCreateOrConnectWithoutStructureInput | AspectCreateOrConnectWithoutStructureInput[]
    createMany?: AspectCreateManyStructureInputEnvelope
    connect?: AspectWhereUniqueInput | AspectWhereUniqueInput[]
  }

  export type CourseUpdateOneRequiredWithoutGradebookStructureNestedInput = {
    create?: XOR<CourseCreateWithoutGradebookStructureInput, CourseUncheckedCreateWithoutGradebookStructureInput>
    connectOrCreate?: CourseCreateOrConnectWithoutGradebookStructureInput
    upsert?: CourseUpsertWithoutGradebookStructureInput
    connect?: CourseWhereUniqueInput
    update?: XOR<XOR<CourseUpdateToOneWithWhereWithoutGradebookStructureInput, CourseUpdateWithoutGradebookStructureInput>, CourseUncheckedUpdateWithoutGradebookStructureInput>
  }

  export type AspectUpdateManyWithoutStructureNestedInput = {
    create?: XOR<AspectCreateWithoutStructureInput, AspectUncheckedCreateWithoutStructureInput> | AspectCreateWithoutStructureInput[] | AspectUncheckedCreateWithoutStructureInput[]
    connectOrCreate?: AspectCreateOrConnectWithoutStructureInput | AspectCreateOrConnectWithoutStructureInput[]
    upsert?: AspectUpsertWithWhereUniqueWithoutStructureInput | AspectUpsertWithWhereUniqueWithoutStructureInput[]
    createMany?: AspectCreateManyStructureInputEnvelope
    set?: AspectWhereUniqueInput | AspectWhereUniqueInput[]
    disconnect?: AspectWhereUniqueInput | AspectWhereUniqueInput[]
    delete?: AspectWhereUniqueInput | AspectWhereUniqueInput[]
    connect?: AspectWhereUniqueInput | AspectWhereUniqueInput[]
    update?: AspectUpdateWithWhereUniqueWithoutStructureInput | AspectUpdateWithWhereUniqueWithoutStructureInput[]
    updateMany?: AspectUpdateManyWithWhereWithoutStructureInput | AspectUpdateManyWithWhereWithoutStructureInput[]
    deleteMany?: AspectScalarWhereInput | AspectScalarWhereInput[]
  }

  export type AspectUncheckedUpdateManyWithoutStructureNestedInput = {
    create?: XOR<AspectCreateWithoutStructureInput, AspectUncheckedCreateWithoutStructureInput> | AspectCreateWithoutStructureInput[] | AspectUncheckedCreateWithoutStructureInput[]
    connectOrCreate?: AspectCreateOrConnectWithoutStructureInput | AspectCreateOrConnectWithoutStructureInput[]
    upsert?: AspectUpsertWithWhereUniqueWithoutStructureInput | AspectUpsertWithWhereUniqueWithoutStructureInput[]
    createMany?: AspectCreateManyStructureInputEnvelope
    set?: AspectWhereUniqueInput | AspectWhereUniqueInput[]
    disconnect?: AspectWhereUniqueInput | AspectWhereUniqueInput[]
    delete?: AspectWhereUniqueInput | AspectWhereUniqueInput[]
    connect?: AspectWhereUniqueInput | AspectWhereUniqueInput[]
    update?: AspectUpdateWithWhereUniqueWithoutStructureInput | AspectUpdateWithWhereUniqueWithoutStructureInput[]
    updateMany?: AspectUpdateManyWithWhereWithoutStructureInput | AspectUpdateManyWithWhereWithoutStructureInput[]
    deleteMany?: AspectScalarWhereInput | AspectScalarWhereInput[]
  }

  export type GradebookStructureCreateNestedOneWithoutAspectsInput = {
    create?: XOR<GradebookStructureCreateWithoutAspectsInput, GradebookStructureUncheckedCreateWithoutAspectsInput>
    connectOrCreate?: GradebookStructureCreateOrConnectWithoutAspectsInput
    connect?: GradebookStructureWhereUniqueInput
  }

  export type IndicatorCreateNestedManyWithoutAspectInput = {
    create?: XOR<IndicatorCreateWithoutAspectInput, IndicatorUncheckedCreateWithoutAspectInput> | IndicatorCreateWithoutAspectInput[] | IndicatorUncheckedCreateWithoutAspectInput[]
    connectOrCreate?: IndicatorCreateOrConnectWithoutAspectInput | IndicatorCreateOrConnectWithoutAspectInput[]
    createMany?: IndicatorCreateManyAspectInputEnvelope
    connect?: IndicatorWhereUniqueInput | IndicatorWhereUniqueInput[]
  }

  export type IndicatorUncheckedCreateNestedManyWithoutAspectInput = {
    create?: XOR<IndicatorCreateWithoutAspectInput, IndicatorUncheckedCreateWithoutAspectInput> | IndicatorCreateWithoutAspectInput[] | IndicatorUncheckedCreateWithoutAspectInput[]
    connectOrCreate?: IndicatorCreateOrConnectWithoutAspectInput | IndicatorCreateOrConnectWithoutAspectInput[]
    createMany?: IndicatorCreateManyAspectInputEnvelope
    connect?: IndicatorWhereUniqueInput | IndicatorWhereUniqueInput[]
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type GradebookStructureUpdateOneRequiredWithoutAspectsNestedInput = {
    create?: XOR<GradebookStructureCreateWithoutAspectsInput, GradebookStructureUncheckedCreateWithoutAspectsInput>
    connectOrCreate?: GradebookStructureCreateOrConnectWithoutAspectsInput
    upsert?: GradebookStructureUpsertWithoutAspectsInput
    connect?: GradebookStructureWhereUniqueInput
    update?: XOR<XOR<GradebookStructureUpdateToOneWithWhereWithoutAspectsInput, GradebookStructureUpdateWithoutAspectsInput>, GradebookStructureUncheckedUpdateWithoutAspectsInput>
  }

  export type IndicatorUpdateManyWithoutAspectNestedInput = {
    create?: XOR<IndicatorCreateWithoutAspectInput, IndicatorUncheckedCreateWithoutAspectInput> | IndicatorCreateWithoutAspectInput[] | IndicatorUncheckedCreateWithoutAspectInput[]
    connectOrCreate?: IndicatorCreateOrConnectWithoutAspectInput | IndicatorCreateOrConnectWithoutAspectInput[]
    upsert?: IndicatorUpsertWithWhereUniqueWithoutAspectInput | IndicatorUpsertWithWhereUniqueWithoutAspectInput[]
    createMany?: IndicatorCreateManyAspectInputEnvelope
    set?: IndicatorWhereUniqueInput | IndicatorWhereUniqueInput[]
    disconnect?: IndicatorWhereUniqueInput | IndicatorWhereUniqueInput[]
    delete?: IndicatorWhereUniqueInput | IndicatorWhereUniqueInput[]
    connect?: IndicatorWhereUniqueInput | IndicatorWhereUniqueInput[]
    update?: IndicatorUpdateWithWhereUniqueWithoutAspectInput | IndicatorUpdateWithWhereUniqueWithoutAspectInput[]
    updateMany?: IndicatorUpdateManyWithWhereWithoutAspectInput | IndicatorUpdateManyWithWhereWithoutAspectInput[]
    deleteMany?: IndicatorScalarWhereInput | IndicatorScalarWhereInput[]
  }

  export type IndicatorUncheckedUpdateManyWithoutAspectNestedInput = {
    create?: XOR<IndicatorCreateWithoutAspectInput, IndicatorUncheckedCreateWithoutAspectInput> | IndicatorCreateWithoutAspectInput[] | IndicatorUncheckedCreateWithoutAspectInput[]
    connectOrCreate?: IndicatorCreateOrConnectWithoutAspectInput | IndicatorCreateOrConnectWithoutAspectInput[]
    upsert?: IndicatorUpsertWithWhereUniqueWithoutAspectInput | IndicatorUpsertWithWhereUniqueWithoutAspectInput[]
    createMany?: IndicatorCreateManyAspectInputEnvelope
    set?: IndicatorWhereUniqueInput | IndicatorWhereUniqueInput[]
    disconnect?: IndicatorWhereUniqueInput | IndicatorWhereUniqueInput[]
    delete?: IndicatorWhereUniqueInput | IndicatorWhereUniqueInput[]
    connect?: IndicatorWhereUniqueInput | IndicatorWhereUniqueInput[]
    update?: IndicatorUpdateWithWhereUniqueWithoutAspectInput | IndicatorUpdateWithWhereUniqueWithoutAspectInput[]
    updateMany?: IndicatorUpdateManyWithWhereWithoutAspectInput | IndicatorUpdateManyWithWhereWithoutAspectInput[]
    deleteMany?: IndicatorScalarWhereInput | IndicatorScalarWhereInput[]
  }

  export type AspectCreateNestedOneWithoutIndicatorsInput = {
    create?: XOR<AspectCreateWithoutIndicatorsInput, AspectUncheckedCreateWithoutIndicatorsInput>
    connectOrCreate?: AspectCreateOrConnectWithoutIndicatorsInput
    connect?: AspectWhereUniqueInput
  }

  export type ActivityCreateNestedManyWithoutIndicatorInput = {
    create?: XOR<ActivityCreateWithoutIndicatorInput, ActivityUncheckedCreateWithoutIndicatorInput> | ActivityCreateWithoutIndicatorInput[] | ActivityUncheckedCreateWithoutIndicatorInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutIndicatorInput | ActivityCreateOrConnectWithoutIndicatorInput[]
    createMany?: ActivityCreateManyIndicatorInputEnvelope
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
  }

  export type ActivityUncheckedCreateNestedManyWithoutIndicatorInput = {
    create?: XOR<ActivityCreateWithoutIndicatorInput, ActivityUncheckedCreateWithoutIndicatorInput> | ActivityCreateWithoutIndicatorInput[] | ActivityUncheckedCreateWithoutIndicatorInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutIndicatorInput | ActivityCreateOrConnectWithoutIndicatorInput[]
    createMany?: ActivityCreateManyIndicatorInputEnvelope
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
  }

  export type AspectUpdateOneRequiredWithoutIndicatorsNestedInput = {
    create?: XOR<AspectCreateWithoutIndicatorsInput, AspectUncheckedCreateWithoutIndicatorsInput>
    connectOrCreate?: AspectCreateOrConnectWithoutIndicatorsInput
    upsert?: AspectUpsertWithoutIndicatorsInput
    connect?: AspectWhereUniqueInput
    update?: XOR<XOR<AspectUpdateToOneWithWhereWithoutIndicatorsInput, AspectUpdateWithoutIndicatorsInput>, AspectUncheckedUpdateWithoutIndicatorsInput>
  }

  export type ActivityUpdateManyWithoutIndicatorNestedInput = {
    create?: XOR<ActivityCreateWithoutIndicatorInput, ActivityUncheckedCreateWithoutIndicatorInput> | ActivityCreateWithoutIndicatorInput[] | ActivityUncheckedCreateWithoutIndicatorInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutIndicatorInput | ActivityCreateOrConnectWithoutIndicatorInput[]
    upsert?: ActivityUpsertWithWhereUniqueWithoutIndicatorInput | ActivityUpsertWithWhereUniqueWithoutIndicatorInput[]
    createMany?: ActivityCreateManyIndicatorInputEnvelope
    set?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    disconnect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    delete?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    update?: ActivityUpdateWithWhereUniqueWithoutIndicatorInput | ActivityUpdateWithWhereUniqueWithoutIndicatorInput[]
    updateMany?: ActivityUpdateManyWithWhereWithoutIndicatorInput | ActivityUpdateManyWithWhereWithoutIndicatorInput[]
    deleteMany?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
  }

  export type ActivityUncheckedUpdateManyWithoutIndicatorNestedInput = {
    create?: XOR<ActivityCreateWithoutIndicatorInput, ActivityUncheckedCreateWithoutIndicatorInput> | ActivityCreateWithoutIndicatorInput[] | ActivityUncheckedCreateWithoutIndicatorInput[]
    connectOrCreate?: ActivityCreateOrConnectWithoutIndicatorInput | ActivityCreateOrConnectWithoutIndicatorInput[]
    upsert?: ActivityUpsertWithWhereUniqueWithoutIndicatorInput | ActivityUpsertWithWhereUniqueWithoutIndicatorInput[]
    createMany?: ActivityCreateManyIndicatorInputEnvelope
    set?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    disconnect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    delete?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    connect?: ActivityWhereUniqueInput | ActivityWhereUniqueInput[]
    update?: ActivityUpdateWithWhereUniqueWithoutIndicatorInput | ActivityUpdateWithWhereUniqueWithoutIndicatorInput[]
    updateMany?: ActivityUpdateManyWithWhereWithoutIndicatorInput | ActivityUpdateManyWithWhereWithoutIndicatorInput[]
    deleteMany?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
  }

  export type IndicatorCreateNestedOneWithoutActivitiesInput = {
    create?: XOR<IndicatorCreateWithoutActivitiesInput, IndicatorUncheckedCreateWithoutActivitiesInput>
    connectOrCreate?: IndicatorCreateOrConnectWithoutActivitiesInput
    connect?: IndicatorWhereUniqueInput
  }

  export type GradeEntryCreateNestedManyWithoutActivityInput = {
    create?: XOR<GradeEntryCreateWithoutActivityInput, GradeEntryUncheckedCreateWithoutActivityInput> | GradeEntryCreateWithoutActivityInput[] | GradeEntryUncheckedCreateWithoutActivityInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutActivityInput | GradeEntryCreateOrConnectWithoutActivityInput[]
    createMany?: GradeEntryCreateManyActivityInputEnvelope
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
  }

  export type GradeEntryUncheckedCreateNestedManyWithoutActivityInput = {
    create?: XOR<GradeEntryCreateWithoutActivityInput, GradeEntryUncheckedCreateWithoutActivityInput> | GradeEntryCreateWithoutActivityInput[] | GradeEntryUncheckedCreateWithoutActivityInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutActivityInput | GradeEntryCreateOrConnectWithoutActivityInput[]
    createMany?: GradeEntryCreateManyActivityInputEnvelope
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
  }

  export type IndicatorUpdateOneRequiredWithoutActivitiesNestedInput = {
    create?: XOR<IndicatorCreateWithoutActivitiesInput, IndicatorUncheckedCreateWithoutActivitiesInput>
    connectOrCreate?: IndicatorCreateOrConnectWithoutActivitiesInput
    upsert?: IndicatorUpsertWithoutActivitiesInput
    connect?: IndicatorWhereUniqueInput
    update?: XOR<XOR<IndicatorUpdateToOneWithWhereWithoutActivitiesInput, IndicatorUpdateWithoutActivitiesInput>, IndicatorUncheckedUpdateWithoutActivitiesInput>
  }

  export type GradeEntryUpdateManyWithoutActivityNestedInput = {
    create?: XOR<GradeEntryCreateWithoutActivityInput, GradeEntryUncheckedCreateWithoutActivityInput> | GradeEntryCreateWithoutActivityInput[] | GradeEntryUncheckedCreateWithoutActivityInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutActivityInput | GradeEntryCreateOrConnectWithoutActivityInput[]
    upsert?: GradeEntryUpsertWithWhereUniqueWithoutActivityInput | GradeEntryUpsertWithWhereUniqueWithoutActivityInput[]
    createMany?: GradeEntryCreateManyActivityInputEnvelope
    set?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    disconnect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    delete?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    update?: GradeEntryUpdateWithWhereUniqueWithoutActivityInput | GradeEntryUpdateWithWhereUniqueWithoutActivityInput[]
    updateMany?: GradeEntryUpdateManyWithWhereWithoutActivityInput | GradeEntryUpdateManyWithWhereWithoutActivityInput[]
    deleteMany?: GradeEntryScalarWhereInput | GradeEntryScalarWhereInput[]
  }

  export type GradeEntryUncheckedUpdateManyWithoutActivityNestedInput = {
    create?: XOR<GradeEntryCreateWithoutActivityInput, GradeEntryUncheckedCreateWithoutActivityInput> | GradeEntryCreateWithoutActivityInput[] | GradeEntryUncheckedCreateWithoutActivityInput[]
    connectOrCreate?: GradeEntryCreateOrConnectWithoutActivityInput | GradeEntryCreateOrConnectWithoutActivityInput[]
    upsert?: GradeEntryUpsertWithWhereUniqueWithoutActivityInput | GradeEntryUpsertWithWhereUniqueWithoutActivityInput[]
    createMany?: GradeEntryCreateManyActivityInputEnvelope
    set?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    disconnect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    delete?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    connect?: GradeEntryWhereUniqueInput | GradeEntryWhereUniqueInput[]
    update?: GradeEntryUpdateWithWhereUniqueWithoutActivityInput | GradeEntryUpdateWithWhereUniqueWithoutActivityInput[]
    updateMany?: GradeEntryUpdateManyWithWhereWithoutActivityInput | GradeEntryUpdateManyWithWhereWithoutActivityInput[]
    deleteMany?: GradeEntryScalarWhereInput | GradeEntryScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutGradebookEntriesInput = {
    create?: XOR<UserCreateWithoutGradebookEntriesInput, UserUncheckedCreateWithoutGradebookEntriesInput>
    connectOrCreate?: UserCreateOrConnectWithoutGradebookEntriesInput
    connect?: UserWhereUniqueInput
  }

  export type ActivityCreateNestedOneWithoutGradeEntriesInput = {
    create?: XOR<ActivityCreateWithoutGradeEntriesInput, ActivityUncheckedCreateWithoutGradeEntriesInput>
    connectOrCreate?: ActivityCreateOrConnectWithoutGradeEntriesInput
    connect?: ActivityWhereUniqueInput
  }

  export type PeriodCreateNestedOneWithoutGradeEntriesInput = {
    create?: XOR<PeriodCreateWithoutGradeEntriesInput, PeriodUncheckedCreateWithoutGradeEntriesInput>
    connectOrCreate?: PeriodCreateOrConnectWithoutGradeEntriesInput
    connect?: PeriodWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutGradebookEntriesNestedInput = {
    create?: XOR<UserCreateWithoutGradebookEntriesInput, UserUncheckedCreateWithoutGradebookEntriesInput>
    connectOrCreate?: UserCreateOrConnectWithoutGradebookEntriesInput
    upsert?: UserUpsertWithoutGradebookEntriesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutGradebookEntriesInput, UserUpdateWithoutGradebookEntriesInput>, UserUncheckedUpdateWithoutGradebookEntriesInput>
  }

  export type ActivityUpdateOneRequiredWithoutGradeEntriesNestedInput = {
    create?: XOR<ActivityCreateWithoutGradeEntriesInput, ActivityUncheckedCreateWithoutGradeEntriesInput>
    connectOrCreate?: ActivityCreateOrConnectWithoutGradeEntriesInput
    upsert?: ActivityUpsertWithoutGradeEntriesInput
    connect?: ActivityWhereUniqueInput
    update?: XOR<XOR<ActivityUpdateToOneWithWhereWithoutGradeEntriesInput, ActivityUpdateWithoutGradeEntriesInput>, ActivityUncheckedUpdateWithoutGradeEntriesInput>
  }

  export type PeriodUpdateOneRequiredWithoutGradeEntriesNestedInput = {
    create?: XOR<PeriodCreateWithoutGradeEntriesInput, PeriodUncheckedCreateWithoutGradeEntriesInput>
    connectOrCreate?: PeriodCreateOrConnectWithoutGradeEntriesInput
    upsert?: PeriodUpsertWithoutGradeEntriesInput
    connect?: PeriodWhereUniqueInput
    update?: XOR<XOR<PeriodUpdateToOneWithWhereWithoutGradeEntriesInput, PeriodUpdateWithoutGradeEntriesInput>, PeriodUncheckedUpdateWithoutGradeEntriesInput>
  }

  export type UserCreateNestedOneWithoutSelfEvaluationsInput = {
    create?: XOR<UserCreateWithoutSelfEvaluationsInput, UserUncheckedCreateWithoutSelfEvaluationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSelfEvaluationsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSelfEvaluationsNestedInput = {
    create?: XOR<UserCreateWithoutSelfEvaluationsInput, UserUncheckedCreateWithoutSelfEvaluationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSelfEvaluationsInput
    upsert?: UserUpsertWithoutSelfEvaluationsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSelfEvaluationsInput, UserUpdateWithoutSelfEvaluationsInput>, UserUncheckedUpdateWithoutSelfEvaluationsInput>
  }

  export type UserCreateNestedOneWithoutPeerEvaluationsGivenInput = {
    create?: XOR<UserCreateWithoutPeerEvaluationsGivenInput, UserUncheckedCreateWithoutPeerEvaluationsGivenInput>
    connectOrCreate?: UserCreateOrConnectWithoutPeerEvaluationsGivenInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutPeerEvaluationsReceivedInput = {
    create?: XOR<UserCreateWithoutPeerEvaluationsReceivedInput, UserUncheckedCreateWithoutPeerEvaluationsReceivedInput>
    connectOrCreate?: UserCreateOrConnectWithoutPeerEvaluationsReceivedInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutPeerEvaluationsGivenNestedInput = {
    create?: XOR<UserCreateWithoutPeerEvaluationsGivenInput, UserUncheckedCreateWithoutPeerEvaluationsGivenInput>
    connectOrCreate?: UserCreateOrConnectWithoutPeerEvaluationsGivenInput
    upsert?: UserUpsertWithoutPeerEvaluationsGivenInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPeerEvaluationsGivenInput, UserUpdateWithoutPeerEvaluationsGivenInput>, UserUncheckedUpdateWithoutPeerEvaluationsGivenInput>
  }

  export type UserUpdateOneRequiredWithoutPeerEvaluationsReceivedNestedInput = {
    create?: XOR<UserCreateWithoutPeerEvaluationsReceivedInput, UserUncheckedCreateWithoutPeerEvaluationsReceivedInput>
    connectOrCreate?: UserCreateOrConnectWithoutPeerEvaluationsReceivedInput
    upsert?: UserUpsertWithoutPeerEvaluationsReceivedInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPeerEvaluationsReceivedInput, UserUpdateWithoutPeerEvaluationsReceivedInput>, UserUncheckedUpdateWithoutPeerEvaluationsReceivedInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumClassStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ClassStatus | EnumClassStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ClassStatus[] | ListEnumClassStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ClassStatus[] | ListEnumClassStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumClassStatusFilter<$PrismaModel> | $Enums.ClassStatus
  }

  export type NestedEnumClassStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ClassStatus | EnumClassStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ClassStatus[] | ListEnumClassStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ClassStatus[] | ListEnumClassStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumClassStatusWithAggregatesFilter<$PrismaModel> | $Enums.ClassStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumClassStatusFilter<$PrismaModel>
    _max?: NestedEnumClassStatusFilter<$PrismaModel>
  }

  export type NestedEnumSlideTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.SlideType | EnumSlideTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SlideType[] | ListEnumSlideTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SlideType[] | ListEnumSlideTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSlideTypeFilter<$PrismaModel> | $Enums.SlideType
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumSlideTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SlideType | EnumSlideTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SlideType[] | ListEnumSlideTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SlideType[] | ListEnumSlideTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSlideTypeWithAggregatesFilter<$PrismaModel> | $Enums.SlideType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSlideTypeFilter<$PrismaModel>
    _max?: NestedEnumSlideTypeFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type CourseCreateWithoutTeacherInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    enrollments?: EnrollmentCreateNestedManyWithoutCourseInput
    classes?: ClassCreateNestedManyWithoutCourseInput
    gradebookStructure?: GradebookStructureCreateNestedOneWithoutCourseInput
    periods?: PeriodCreateNestedManyWithoutCourseInput
  }

  export type CourseUncheckedCreateWithoutTeacherInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutCourseInput
    classes?: ClassUncheckedCreateNestedManyWithoutCourseInput
    gradebookStructure?: GradebookStructureUncheckedCreateNestedOneWithoutCourseInput
    periods?: PeriodUncheckedCreateNestedManyWithoutCourseInput
  }

  export type CourseCreateOrConnectWithoutTeacherInput = {
    where: CourseWhereUniqueInput
    create: XOR<CourseCreateWithoutTeacherInput, CourseUncheckedCreateWithoutTeacherInput>
  }

  export type CourseCreateManyTeacherInputEnvelope = {
    data: CourseCreateManyTeacherInput | CourseCreateManyTeacherInput[]
    skipDuplicates?: boolean
  }

  export type EnrollmentCreateWithoutUserInput = {
    id?: string
    createdAt?: Date | string
    course: CourseCreateNestedOneWithoutEnrollmentsInput
  }

  export type EnrollmentUncheckedCreateWithoutUserInput = {
    id?: string
    courseId: string
    createdAt?: Date | string
  }

  export type EnrollmentCreateOrConnectWithoutUserInput = {
    where: EnrollmentWhereUniqueInput
    create: XOR<EnrollmentCreateWithoutUserInput, EnrollmentUncheckedCreateWithoutUserInput>
  }

  export type EnrollmentCreateManyUserInputEnvelope = {
    data: EnrollmentCreateManyUserInput | EnrollmentCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type GradeEntryCreateWithoutUserInput = {
    id?: string
    score: number
    feedback?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    activity: ActivityCreateNestedOneWithoutGradeEntriesInput
    period: PeriodCreateNestedOneWithoutGradeEntriesInput
  }

  export type GradeEntryUncheckedCreateWithoutUserInput = {
    id?: string
    score: number
    feedback?: string | null
    activityId: string
    periodId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GradeEntryCreateOrConnectWithoutUserInput = {
    where: GradeEntryWhereUniqueInput
    create: XOR<GradeEntryCreateWithoutUserInput, GradeEntryUncheckedCreateWithoutUserInput>
  }

  export type GradeEntryCreateManyUserInputEnvelope = {
    data: GradeEntryCreateManyUserInput | GradeEntryCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SelfEvaluationCreateWithoutUserInput = {
    id?: string
    score: number
    feedback?: string | null
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type SelfEvaluationUncheckedCreateWithoutUserInput = {
    id?: string
    score: number
    feedback?: string | null
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type SelfEvaluationCreateOrConnectWithoutUserInput = {
    where: SelfEvaluationWhereUniqueInput
    create: XOR<SelfEvaluationCreateWithoutUserInput, SelfEvaluationUncheckedCreateWithoutUserInput>
  }

  export type SelfEvaluationCreateManyUserInputEnvelope = {
    data: SelfEvaluationCreateManyUserInput | SelfEvaluationCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type PeerEvaluationCreateWithoutEvaluatorInput = {
    id?: string
    score: number
    feedback?: string | null
    courseId: string
    periodId: string
    createdAt?: Date | string
    evaluated: UserCreateNestedOneWithoutPeerEvaluationsReceivedInput
  }

  export type PeerEvaluationUncheckedCreateWithoutEvaluatorInput = {
    id?: string
    score: number
    feedback?: string | null
    evaluatedId: string
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type PeerEvaluationCreateOrConnectWithoutEvaluatorInput = {
    where: PeerEvaluationWhereUniqueInput
    create: XOR<PeerEvaluationCreateWithoutEvaluatorInput, PeerEvaluationUncheckedCreateWithoutEvaluatorInput>
  }

  export type PeerEvaluationCreateManyEvaluatorInputEnvelope = {
    data: PeerEvaluationCreateManyEvaluatorInput | PeerEvaluationCreateManyEvaluatorInput[]
    skipDuplicates?: boolean
  }

  export type PeerEvaluationCreateWithoutEvaluatedInput = {
    id?: string
    score: number
    feedback?: string | null
    courseId: string
    periodId: string
    createdAt?: Date | string
    evaluator: UserCreateNestedOneWithoutPeerEvaluationsGivenInput
  }

  export type PeerEvaluationUncheckedCreateWithoutEvaluatedInput = {
    id?: string
    score: number
    feedback?: string | null
    evaluatorId: string
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type PeerEvaluationCreateOrConnectWithoutEvaluatedInput = {
    where: PeerEvaluationWhereUniqueInput
    create: XOR<PeerEvaluationCreateWithoutEvaluatedInput, PeerEvaluationUncheckedCreateWithoutEvaluatedInput>
  }

  export type PeerEvaluationCreateManyEvaluatedInputEnvelope = {
    data: PeerEvaluationCreateManyEvaluatedInput | PeerEvaluationCreateManyEvaluatedInput[]
    skipDuplicates?: boolean
  }

  export type CourseUpsertWithWhereUniqueWithoutTeacherInput = {
    where: CourseWhereUniqueInput
    update: XOR<CourseUpdateWithoutTeacherInput, CourseUncheckedUpdateWithoutTeacherInput>
    create: XOR<CourseCreateWithoutTeacherInput, CourseUncheckedCreateWithoutTeacherInput>
  }

  export type CourseUpdateWithWhereUniqueWithoutTeacherInput = {
    where: CourseWhereUniqueInput
    data: XOR<CourseUpdateWithoutTeacherInput, CourseUncheckedUpdateWithoutTeacherInput>
  }

  export type CourseUpdateManyWithWhereWithoutTeacherInput = {
    where: CourseScalarWhereInput
    data: XOR<CourseUpdateManyMutationInput, CourseUncheckedUpdateManyWithoutTeacherInput>
  }

  export type CourseScalarWhereInput = {
    AND?: CourseScalarWhereInput | CourseScalarWhereInput[]
    OR?: CourseScalarWhereInput[]
    NOT?: CourseScalarWhereInput | CourseScalarWhereInput[]
    id?: StringFilter<"Course"> | string
    name?: StringFilter<"Course"> | string
    description?: StringNullableFilter<"Course"> | string | null
    code?: StringFilter<"Course"> | string
    isActive?: BoolFilter<"Course"> | boolean
    teacherId?: StringFilter<"Course"> | string
    createdAt?: DateTimeFilter<"Course"> | Date | string
    updatedAt?: DateTimeFilter<"Course"> | Date | string
  }

  export type EnrollmentUpsertWithWhereUniqueWithoutUserInput = {
    where: EnrollmentWhereUniqueInput
    update: XOR<EnrollmentUpdateWithoutUserInput, EnrollmentUncheckedUpdateWithoutUserInput>
    create: XOR<EnrollmentCreateWithoutUserInput, EnrollmentUncheckedCreateWithoutUserInput>
  }

  export type EnrollmentUpdateWithWhereUniqueWithoutUserInput = {
    where: EnrollmentWhereUniqueInput
    data: XOR<EnrollmentUpdateWithoutUserInput, EnrollmentUncheckedUpdateWithoutUserInput>
  }

  export type EnrollmentUpdateManyWithWhereWithoutUserInput = {
    where: EnrollmentScalarWhereInput
    data: XOR<EnrollmentUpdateManyMutationInput, EnrollmentUncheckedUpdateManyWithoutUserInput>
  }

  export type EnrollmentScalarWhereInput = {
    AND?: EnrollmentScalarWhereInput | EnrollmentScalarWhereInput[]
    OR?: EnrollmentScalarWhereInput[]
    NOT?: EnrollmentScalarWhereInput | EnrollmentScalarWhereInput[]
    id?: StringFilter<"Enrollment"> | string
    userId?: StringFilter<"Enrollment"> | string
    courseId?: StringFilter<"Enrollment"> | string
    createdAt?: DateTimeFilter<"Enrollment"> | Date | string
  }

  export type GradeEntryUpsertWithWhereUniqueWithoutUserInput = {
    where: GradeEntryWhereUniqueInput
    update: XOR<GradeEntryUpdateWithoutUserInput, GradeEntryUncheckedUpdateWithoutUserInput>
    create: XOR<GradeEntryCreateWithoutUserInput, GradeEntryUncheckedCreateWithoutUserInput>
  }

  export type GradeEntryUpdateWithWhereUniqueWithoutUserInput = {
    where: GradeEntryWhereUniqueInput
    data: XOR<GradeEntryUpdateWithoutUserInput, GradeEntryUncheckedUpdateWithoutUserInput>
  }

  export type GradeEntryUpdateManyWithWhereWithoutUserInput = {
    where: GradeEntryScalarWhereInput
    data: XOR<GradeEntryUpdateManyMutationInput, GradeEntryUncheckedUpdateManyWithoutUserInput>
  }

  export type GradeEntryScalarWhereInput = {
    AND?: GradeEntryScalarWhereInput | GradeEntryScalarWhereInput[]
    OR?: GradeEntryScalarWhereInput[]
    NOT?: GradeEntryScalarWhereInput | GradeEntryScalarWhereInput[]
    id?: StringFilter<"GradeEntry"> | string
    score?: FloatFilter<"GradeEntry"> | number
    feedback?: StringNullableFilter<"GradeEntry"> | string | null
    userId?: StringFilter<"GradeEntry"> | string
    activityId?: StringFilter<"GradeEntry"> | string
    periodId?: StringFilter<"GradeEntry"> | string
    createdAt?: DateTimeFilter<"GradeEntry"> | Date | string
    updatedAt?: DateTimeFilter<"GradeEntry"> | Date | string
  }

  export type SelfEvaluationUpsertWithWhereUniqueWithoutUserInput = {
    where: SelfEvaluationWhereUniqueInput
    update: XOR<SelfEvaluationUpdateWithoutUserInput, SelfEvaluationUncheckedUpdateWithoutUserInput>
    create: XOR<SelfEvaluationCreateWithoutUserInput, SelfEvaluationUncheckedCreateWithoutUserInput>
  }

  export type SelfEvaluationUpdateWithWhereUniqueWithoutUserInput = {
    where: SelfEvaluationWhereUniqueInput
    data: XOR<SelfEvaluationUpdateWithoutUserInput, SelfEvaluationUncheckedUpdateWithoutUserInput>
  }

  export type SelfEvaluationUpdateManyWithWhereWithoutUserInput = {
    where: SelfEvaluationScalarWhereInput
    data: XOR<SelfEvaluationUpdateManyMutationInput, SelfEvaluationUncheckedUpdateManyWithoutUserInput>
  }

  export type SelfEvaluationScalarWhereInput = {
    AND?: SelfEvaluationScalarWhereInput | SelfEvaluationScalarWhereInput[]
    OR?: SelfEvaluationScalarWhereInput[]
    NOT?: SelfEvaluationScalarWhereInput | SelfEvaluationScalarWhereInput[]
    id?: StringFilter<"SelfEvaluation"> | string
    score?: FloatFilter<"SelfEvaluation"> | number
    feedback?: StringNullableFilter<"SelfEvaluation"> | string | null
    userId?: StringFilter<"SelfEvaluation"> | string
    courseId?: StringFilter<"SelfEvaluation"> | string
    periodId?: StringFilter<"SelfEvaluation"> | string
    createdAt?: DateTimeFilter<"SelfEvaluation"> | Date | string
  }

  export type PeerEvaluationUpsertWithWhereUniqueWithoutEvaluatorInput = {
    where: PeerEvaluationWhereUniqueInput
    update: XOR<PeerEvaluationUpdateWithoutEvaluatorInput, PeerEvaluationUncheckedUpdateWithoutEvaluatorInput>
    create: XOR<PeerEvaluationCreateWithoutEvaluatorInput, PeerEvaluationUncheckedCreateWithoutEvaluatorInput>
  }

  export type PeerEvaluationUpdateWithWhereUniqueWithoutEvaluatorInput = {
    where: PeerEvaluationWhereUniqueInput
    data: XOR<PeerEvaluationUpdateWithoutEvaluatorInput, PeerEvaluationUncheckedUpdateWithoutEvaluatorInput>
  }

  export type PeerEvaluationUpdateManyWithWhereWithoutEvaluatorInput = {
    where: PeerEvaluationScalarWhereInput
    data: XOR<PeerEvaluationUpdateManyMutationInput, PeerEvaluationUncheckedUpdateManyWithoutEvaluatorInput>
  }

  export type PeerEvaluationScalarWhereInput = {
    AND?: PeerEvaluationScalarWhereInput | PeerEvaluationScalarWhereInput[]
    OR?: PeerEvaluationScalarWhereInput[]
    NOT?: PeerEvaluationScalarWhereInput | PeerEvaluationScalarWhereInput[]
    id?: StringFilter<"PeerEvaluation"> | string
    score?: FloatFilter<"PeerEvaluation"> | number
    feedback?: StringNullableFilter<"PeerEvaluation"> | string | null
    evaluatorId?: StringFilter<"PeerEvaluation"> | string
    evaluatedId?: StringFilter<"PeerEvaluation"> | string
    courseId?: StringFilter<"PeerEvaluation"> | string
    periodId?: StringFilter<"PeerEvaluation"> | string
    createdAt?: DateTimeFilter<"PeerEvaluation"> | Date | string
  }

  export type PeerEvaluationUpsertWithWhereUniqueWithoutEvaluatedInput = {
    where: PeerEvaluationWhereUniqueInput
    update: XOR<PeerEvaluationUpdateWithoutEvaluatedInput, PeerEvaluationUncheckedUpdateWithoutEvaluatedInput>
    create: XOR<PeerEvaluationCreateWithoutEvaluatedInput, PeerEvaluationUncheckedCreateWithoutEvaluatedInput>
  }

  export type PeerEvaluationUpdateWithWhereUniqueWithoutEvaluatedInput = {
    where: PeerEvaluationWhereUniqueInput
    data: XOR<PeerEvaluationUpdateWithoutEvaluatedInput, PeerEvaluationUncheckedUpdateWithoutEvaluatedInput>
  }

  export type PeerEvaluationUpdateManyWithWhereWithoutEvaluatedInput = {
    where: PeerEvaluationScalarWhereInput
    data: XOR<PeerEvaluationUpdateManyMutationInput, PeerEvaluationUncheckedUpdateManyWithoutEvaluatedInput>
  }

  export type UserCreateWithoutTeacherCoursesInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    enrollments?: EnrollmentCreateNestedManyWithoutUserInput
    gradebookEntries?: GradeEntryCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationCreateNestedManyWithoutEvaluatorInput
    peerEvaluationsReceived?: PeerEvaluationCreateNestedManyWithoutEvaluatedInput
  }

  export type UserUncheckedCreateWithoutTeacherCoursesInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutUserInput
    gradebookEntries?: GradeEntryUncheckedCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationUncheckedCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatorInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatedInput
  }

  export type UserCreateOrConnectWithoutTeacherCoursesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTeacherCoursesInput, UserUncheckedCreateWithoutTeacherCoursesInput>
  }

  export type EnrollmentCreateWithoutCourseInput = {
    id?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutEnrollmentsInput
  }

  export type EnrollmentUncheckedCreateWithoutCourseInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type EnrollmentCreateOrConnectWithoutCourseInput = {
    where: EnrollmentWhereUniqueInput
    create: XOR<EnrollmentCreateWithoutCourseInput, EnrollmentUncheckedCreateWithoutCourseInput>
  }

  export type EnrollmentCreateManyCourseInputEnvelope = {
    data: EnrollmentCreateManyCourseInput | EnrollmentCreateManyCourseInput[]
    skipDuplicates?: boolean
  }

  export type ClassCreateWithoutCourseInput = {
    id?: string
    title: string
    description?: string | null
    code: string
    status?: $Enums.ClassStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    slides?: SlideCreateNestedManyWithoutClassInput
  }

  export type ClassUncheckedCreateWithoutCourseInput = {
    id?: string
    title: string
    description?: string | null
    code: string
    status?: $Enums.ClassStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    slides?: SlideUncheckedCreateNestedManyWithoutClassInput
  }

  export type ClassCreateOrConnectWithoutCourseInput = {
    where: ClassWhereUniqueInput
    create: XOR<ClassCreateWithoutCourseInput, ClassUncheckedCreateWithoutCourseInput>
  }

  export type ClassCreateManyCourseInputEnvelope = {
    data: ClassCreateManyCourseInput | ClassCreateManyCourseInput[]
    skipDuplicates?: boolean
  }

  export type GradebookStructureCreateWithoutCourseInput = {
    id?: string
    aspects?: AspectCreateNestedManyWithoutStructureInput
  }

  export type GradebookStructureUncheckedCreateWithoutCourseInput = {
    id?: string
    aspects?: AspectUncheckedCreateNestedManyWithoutStructureInput
  }

  export type GradebookStructureCreateOrConnectWithoutCourseInput = {
    where: GradebookStructureWhereUniqueInput
    create: XOR<GradebookStructureCreateWithoutCourseInput, GradebookStructureUncheckedCreateWithoutCourseInput>
  }

  export type PeriodCreateWithoutCourseInput = {
    id?: string
    name: string
    startDate: Date | string
    endDate: Date | string
    isActive?: boolean
    createdAt?: Date | string
    gradeEntries?: GradeEntryCreateNestedManyWithoutPeriodInput
  }

  export type PeriodUncheckedCreateWithoutCourseInput = {
    id?: string
    name: string
    startDate: Date | string
    endDate: Date | string
    isActive?: boolean
    createdAt?: Date | string
    gradeEntries?: GradeEntryUncheckedCreateNestedManyWithoutPeriodInput
  }

  export type PeriodCreateOrConnectWithoutCourseInput = {
    where: PeriodWhereUniqueInput
    create: XOR<PeriodCreateWithoutCourseInput, PeriodUncheckedCreateWithoutCourseInput>
  }

  export type PeriodCreateManyCourseInputEnvelope = {
    data: PeriodCreateManyCourseInput | PeriodCreateManyCourseInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutTeacherCoursesInput = {
    update: XOR<UserUpdateWithoutTeacherCoursesInput, UserUncheckedUpdateWithoutTeacherCoursesInput>
    create: XOR<UserCreateWithoutTeacherCoursesInput, UserUncheckedCreateWithoutTeacherCoursesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutTeacherCoursesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutTeacherCoursesInput, UserUncheckedUpdateWithoutTeacherCoursesInput>
  }

  export type UserUpdateWithoutTeacherCoursesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    enrollments?: EnrollmentUpdateManyWithoutUserNestedInput
    gradebookEntries?: GradeEntryUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUpdateManyWithoutEvaluatorNestedInput
    peerEvaluationsReceived?: PeerEvaluationUpdateManyWithoutEvaluatedNestedInput
  }

  export type UserUncheckedUpdateWithoutTeacherCoursesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    enrollments?: EnrollmentUncheckedUpdateManyWithoutUserNestedInput
    gradebookEntries?: GradeEntryUncheckedUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUncheckedUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatorNestedInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatedNestedInput
  }

  export type EnrollmentUpsertWithWhereUniqueWithoutCourseInput = {
    where: EnrollmentWhereUniqueInput
    update: XOR<EnrollmentUpdateWithoutCourseInput, EnrollmentUncheckedUpdateWithoutCourseInput>
    create: XOR<EnrollmentCreateWithoutCourseInput, EnrollmentUncheckedCreateWithoutCourseInput>
  }

  export type EnrollmentUpdateWithWhereUniqueWithoutCourseInput = {
    where: EnrollmentWhereUniqueInput
    data: XOR<EnrollmentUpdateWithoutCourseInput, EnrollmentUncheckedUpdateWithoutCourseInput>
  }

  export type EnrollmentUpdateManyWithWhereWithoutCourseInput = {
    where: EnrollmentScalarWhereInput
    data: XOR<EnrollmentUpdateManyMutationInput, EnrollmentUncheckedUpdateManyWithoutCourseInput>
  }

  export type ClassUpsertWithWhereUniqueWithoutCourseInput = {
    where: ClassWhereUniqueInput
    update: XOR<ClassUpdateWithoutCourseInput, ClassUncheckedUpdateWithoutCourseInput>
    create: XOR<ClassCreateWithoutCourseInput, ClassUncheckedCreateWithoutCourseInput>
  }

  export type ClassUpdateWithWhereUniqueWithoutCourseInput = {
    where: ClassWhereUniqueInput
    data: XOR<ClassUpdateWithoutCourseInput, ClassUncheckedUpdateWithoutCourseInput>
  }

  export type ClassUpdateManyWithWhereWithoutCourseInput = {
    where: ClassScalarWhereInput
    data: XOR<ClassUpdateManyMutationInput, ClassUncheckedUpdateManyWithoutCourseInput>
  }

  export type ClassScalarWhereInput = {
    AND?: ClassScalarWhereInput | ClassScalarWhereInput[]
    OR?: ClassScalarWhereInput[]
    NOT?: ClassScalarWhereInput | ClassScalarWhereInput[]
    id?: StringFilter<"Class"> | string
    title?: StringFilter<"Class"> | string
    description?: StringNullableFilter<"Class"> | string | null
    code?: StringFilter<"Class"> | string
    status?: EnumClassStatusFilter<"Class"> | $Enums.ClassStatus
    courseId?: StringFilter<"Class"> | string
    createdAt?: DateTimeFilter<"Class"> | Date | string
    updatedAt?: DateTimeFilter<"Class"> | Date | string
  }

  export type GradebookStructureUpsertWithoutCourseInput = {
    update: XOR<GradebookStructureUpdateWithoutCourseInput, GradebookStructureUncheckedUpdateWithoutCourseInput>
    create: XOR<GradebookStructureCreateWithoutCourseInput, GradebookStructureUncheckedCreateWithoutCourseInput>
    where?: GradebookStructureWhereInput
  }

  export type GradebookStructureUpdateToOneWithWhereWithoutCourseInput = {
    where?: GradebookStructureWhereInput
    data: XOR<GradebookStructureUpdateWithoutCourseInput, GradebookStructureUncheckedUpdateWithoutCourseInput>
  }

  export type GradebookStructureUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    aspects?: AspectUpdateManyWithoutStructureNestedInput
  }

  export type GradebookStructureUncheckedUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    aspects?: AspectUncheckedUpdateManyWithoutStructureNestedInput
  }

  export type PeriodUpsertWithWhereUniqueWithoutCourseInput = {
    where: PeriodWhereUniqueInput
    update: XOR<PeriodUpdateWithoutCourseInput, PeriodUncheckedUpdateWithoutCourseInput>
    create: XOR<PeriodCreateWithoutCourseInput, PeriodUncheckedCreateWithoutCourseInput>
  }

  export type PeriodUpdateWithWhereUniqueWithoutCourseInput = {
    where: PeriodWhereUniqueInput
    data: XOR<PeriodUpdateWithoutCourseInput, PeriodUncheckedUpdateWithoutCourseInput>
  }

  export type PeriodUpdateManyWithWhereWithoutCourseInput = {
    where: PeriodScalarWhereInput
    data: XOR<PeriodUpdateManyMutationInput, PeriodUncheckedUpdateManyWithoutCourseInput>
  }

  export type PeriodScalarWhereInput = {
    AND?: PeriodScalarWhereInput | PeriodScalarWhereInput[]
    OR?: PeriodScalarWhereInput[]
    NOT?: PeriodScalarWhereInput | PeriodScalarWhereInput[]
    id?: StringFilter<"Period"> | string
    name?: StringFilter<"Period"> | string
    startDate?: DateTimeFilter<"Period"> | Date | string
    endDate?: DateTimeFilter<"Period"> | Date | string
    isActive?: BoolFilter<"Period"> | boolean
    courseId?: StringFilter<"Period"> | string
    createdAt?: DateTimeFilter<"Period"> | Date | string
  }

  export type CourseCreateWithoutPeriodsInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacher: UserCreateNestedOneWithoutTeacherCoursesInput
    enrollments?: EnrollmentCreateNestedManyWithoutCourseInput
    classes?: ClassCreateNestedManyWithoutCourseInput
    gradebookStructure?: GradebookStructureCreateNestedOneWithoutCourseInput
  }

  export type CourseUncheckedCreateWithoutPeriodsInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    teacherId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutCourseInput
    classes?: ClassUncheckedCreateNestedManyWithoutCourseInput
    gradebookStructure?: GradebookStructureUncheckedCreateNestedOneWithoutCourseInput
  }

  export type CourseCreateOrConnectWithoutPeriodsInput = {
    where: CourseWhereUniqueInput
    create: XOR<CourseCreateWithoutPeriodsInput, CourseUncheckedCreateWithoutPeriodsInput>
  }

  export type GradeEntryCreateWithoutPeriodInput = {
    id?: string
    score: number
    feedback?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutGradebookEntriesInput
    activity: ActivityCreateNestedOneWithoutGradeEntriesInput
  }

  export type GradeEntryUncheckedCreateWithoutPeriodInput = {
    id?: string
    score: number
    feedback?: string | null
    userId: string
    activityId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GradeEntryCreateOrConnectWithoutPeriodInput = {
    where: GradeEntryWhereUniqueInput
    create: XOR<GradeEntryCreateWithoutPeriodInput, GradeEntryUncheckedCreateWithoutPeriodInput>
  }

  export type GradeEntryCreateManyPeriodInputEnvelope = {
    data: GradeEntryCreateManyPeriodInput | GradeEntryCreateManyPeriodInput[]
    skipDuplicates?: boolean
  }

  export type CourseUpsertWithoutPeriodsInput = {
    update: XOR<CourseUpdateWithoutPeriodsInput, CourseUncheckedUpdateWithoutPeriodsInput>
    create: XOR<CourseCreateWithoutPeriodsInput, CourseUncheckedCreateWithoutPeriodsInput>
    where?: CourseWhereInput
  }

  export type CourseUpdateToOneWithWhereWithoutPeriodsInput = {
    where?: CourseWhereInput
    data: XOR<CourseUpdateWithoutPeriodsInput, CourseUncheckedUpdateWithoutPeriodsInput>
  }

  export type CourseUpdateWithoutPeriodsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacher?: UserUpdateOneRequiredWithoutTeacherCoursesNestedInput
    enrollments?: EnrollmentUpdateManyWithoutCourseNestedInput
    classes?: ClassUpdateManyWithoutCourseNestedInput
    gradebookStructure?: GradebookStructureUpdateOneWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateWithoutPeriodsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    teacherId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    enrollments?: EnrollmentUncheckedUpdateManyWithoutCourseNestedInput
    classes?: ClassUncheckedUpdateManyWithoutCourseNestedInput
    gradebookStructure?: GradebookStructureUncheckedUpdateOneWithoutCourseNestedInput
  }

  export type GradeEntryUpsertWithWhereUniqueWithoutPeriodInput = {
    where: GradeEntryWhereUniqueInput
    update: XOR<GradeEntryUpdateWithoutPeriodInput, GradeEntryUncheckedUpdateWithoutPeriodInput>
    create: XOR<GradeEntryCreateWithoutPeriodInput, GradeEntryUncheckedCreateWithoutPeriodInput>
  }

  export type GradeEntryUpdateWithWhereUniqueWithoutPeriodInput = {
    where: GradeEntryWhereUniqueInput
    data: XOR<GradeEntryUpdateWithoutPeriodInput, GradeEntryUncheckedUpdateWithoutPeriodInput>
  }

  export type GradeEntryUpdateManyWithWhereWithoutPeriodInput = {
    where: GradeEntryScalarWhereInput
    data: XOR<GradeEntryUpdateManyMutationInput, GradeEntryUncheckedUpdateManyWithoutPeriodInput>
  }

  export type UserCreateWithoutEnrollmentsInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseCreateNestedManyWithoutTeacherInput
    gradebookEntries?: GradeEntryCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationCreateNestedManyWithoutEvaluatorInput
    peerEvaluationsReceived?: PeerEvaluationCreateNestedManyWithoutEvaluatedInput
  }

  export type UserUncheckedCreateWithoutEnrollmentsInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseUncheckedCreateNestedManyWithoutTeacherInput
    gradebookEntries?: GradeEntryUncheckedCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationUncheckedCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatorInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatedInput
  }

  export type UserCreateOrConnectWithoutEnrollmentsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutEnrollmentsInput, UserUncheckedCreateWithoutEnrollmentsInput>
  }

  export type CourseCreateWithoutEnrollmentsInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacher: UserCreateNestedOneWithoutTeacherCoursesInput
    classes?: ClassCreateNestedManyWithoutCourseInput
    gradebookStructure?: GradebookStructureCreateNestedOneWithoutCourseInput
    periods?: PeriodCreateNestedManyWithoutCourseInput
  }

  export type CourseUncheckedCreateWithoutEnrollmentsInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    teacherId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    classes?: ClassUncheckedCreateNestedManyWithoutCourseInput
    gradebookStructure?: GradebookStructureUncheckedCreateNestedOneWithoutCourseInput
    periods?: PeriodUncheckedCreateNestedManyWithoutCourseInput
  }

  export type CourseCreateOrConnectWithoutEnrollmentsInput = {
    where: CourseWhereUniqueInput
    create: XOR<CourseCreateWithoutEnrollmentsInput, CourseUncheckedCreateWithoutEnrollmentsInput>
  }

  export type UserUpsertWithoutEnrollmentsInput = {
    update: XOR<UserUpdateWithoutEnrollmentsInput, UserUncheckedUpdateWithoutEnrollmentsInput>
    create: XOR<UserCreateWithoutEnrollmentsInput, UserUncheckedCreateWithoutEnrollmentsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutEnrollmentsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutEnrollmentsInput, UserUncheckedUpdateWithoutEnrollmentsInput>
  }

  export type UserUpdateWithoutEnrollmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUpdateManyWithoutTeacherNestedInput
    gradebookEntries?: GradeEntryUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUpdateManyWithoutEvaluatorNestedInput
    peerEvaluationsReceived?: PeerEvaluationUpdateManyWithoutEvaluatedNestedInput
  }

  export type UserUncheckedUpdateWithoutEnrollmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUncheckedUpdateManyWithoutTeacherNestedInput
    gradebookEntries?: GradeEntryUncheckedUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUncheckedUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatorNestedInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatedNestedInput
  }

  export type CourseUpsertWithoutEnrollmentsInput = {
    update: XOR<CourseUpdateWithoutEnrollmentsInput, CourseUncheckedUpdateWithoutEnrollmentsInput>
    create: XOR<CourseCreateWithoutEnrollmentsInput, CourseUncheckedCreateWithoutEnrollmentsInput>
    where?: CourseWhereInput
  }

  export type CourseUpdateToOneWithWhereWithoutEnrollmentsInput = {
    where?: CourseWhereInput
    data: XOR<CourseUpdateWithoutEnrollmentsInput, CourseUncheckedUpdateWithoutEnrollmentsInput>
  }

  export type CourseUpdateWithoutEnrollmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacher?: UserUpdateOneRequiredWithoutTeacherCoursesNestedInput
    classes?: ClassUpdateManyWithoutCourseNestedInput
    gradebookStructure?: GradebookStructureUpdateOneWithoutCourseNestedInput
    periods?: PeriodUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateWithoutEnrollmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    teacherId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    classes?: ClassUncheckedUpdateManyWithoutCourseNestedInput
    gradebookStructure?: GradebookStructureUncheckedUpdateOneWithoutCourseNestedInput
    periods?: PeriodUncheckedUpdateManyWithoutCourseNestedInput
  }

  export type CourseCreateWithoutClassesInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacher: UserCreateNestedOneWithoutTeacherCoursesInput
    enrollments?: EnrollmentCreateNestedManyWithoutCourseInput
    gradebookStructure?: GradebookStructureCreateNestedOneWithoutCourseInput
    periods?: PeriodCreateNestedManyWithoutCourseInput
  }

  export type CourseUncheckedCreateWithoutClassesInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    teacherId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutCourseInput
    gradebookStructure?: GradebookStructureUncheckedCreateNestedOneWithoutCourseInput
    periods?: PeriodUncheckedCreateNestedManyWithoutCourseInput
  }

  export type CourseCreateOrConnectWithoutClassesInput = {
    where: CourseWhereUniqueInput
    create: XOR<CourseCreateWithoutClassesInput, CourseUncheckedCreateWithoutClassesInput>
  }

  export type SlideCreateWithoutClassInput = {
    id?: string
    order: number
    type: $Enums.SlideType
    title: string
    content?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SlideUncheckedCreateWithoutClassInput = {
    id?: string
    order: number
    type: $Enums.SlideType
    title: string
    content?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SlideCreateOrConnectWithoutClassInput = {
    where: SlideWhereUniqueInput
    create: XOR<SlideCreateWithoutClassInput, SlideUncheckedCreateWithoutClassInput>
  }

  export type SlideCreateManyClassInputEnvelope = {
    data: SlideCreateManyClassInput | SlideCreateManyClassInput[]
    skipDuplicates?: boolean
  }

  export type CourseUpsertWithoutClassesInput = {
    update: XOR<CourseUpdateWithoutClassesInput, CourseUncheckedUpdateWithoutClassesInput>
    create: XOR<CourseCreateWithoutClassesInput, CourseUncheckedCreateWithoutClassesInput>
    where?: CourseWhereInput
  }

  export type CourseUpdateToOneWithWhereWithoutClassesInput = {
    where?: CourseWhereInput
    data: XOR<CourseUpdateWithoutClassesInput, CourseUncheckedUpdateWithoutClassesInput>
  }

  export type CourseUpdateWithoutClassesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacher?: UserUpdateOneRequiredWithoutTeacherCoursesNestedInput
    enrollments?: EnrollmentUpdateManyWithoutCourseNestedInput
    gradebookStructure?: GradebookStructureUpdateOneWithoutCourseNestedInput
    periods?: PeriodUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateWithoutClassesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    teacherId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    enrollments?: EnrollmentUncheckedUpdateManyWithoutCourseNestedInput
    gradebookStructure?: GradebookStructureUncheckedUpdateOneWithoutCourseNestedInput
    periods?: PeriodUncheckedUpdateManyWithoutCourseNestedInput
  }

  export type SlideUpsertWithWhereUniqueWithoutClassInput = {
    where: SlideWhereUniqueInput
    update: XOR<SlideUpdateWithoutClassInput, SlideUncheckedUpdateWithoutClassInput>
    create: XOR<SlideCreateWithoutClassInput, SlideUncheckedCreateWithoutClassInput>
  }

  export type SlideUpdateWithWhereUniqueWithoutClassInput = {
    where: SlideWhereUniqueInput
    data: XOR<SlideUpdateWithoutClassInput, SlideUncheckedUpdateWithoutClassInput>
  }

  export type SlideUpdateManyWithWhereWithoutClassInput = {
    where: SlideScalarWhereInput
    data: XOR<SlideUpdateManyMutationInput, SlideUncheckedUpdateManyWithoutClassInput>
  }

  export type SlideScalarWhereInput = {
    AND?: SlideScalarWhereInput | SlideScalarWhereInput[]
    OR?: SlideScalarWhereInput[]
    NOT?: SlideScalarWhereInput | SlideScalarWhereInput[]
    id?: StringFilter<"Slide"> | string
    order?: IntFilter<"Slide"> | number
    type?: EnumSlideTypeFilter<"Slide"> | $Enums.SlideType
    title?: StringFilter<"Slide"> | string
    content?: JsonNullableFilter<"Slide">
    classId?: StringFilter<"Slide"> | string
    createdAt?: DateTimeFilter<"Slide"> | Date | string
  }

  export type ClassCreateWithoutSlidesInput = {
    id?: string
    title: string
    description?: string | null
    code: string
    status?: $Enums.ClassStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    course: CourseCreateNestedOneWithoutClassesInput
  }

  export type ClassUncheckedCreateWithoutSlidesInput = {
    id?: string
    title: string
    description?: string | null
    code: string
    status?: $Enums.ClassStatus
    courseId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ClassCreateOrConnectWithoutSlidesInput = {
    where: ClassWhereUniqueInput
    create: XOR<ClassCreateWithoutSlidesInput, ClassUncheckedCreateWithoutSlidesInput>
  }

  export type ClassUpsertWithoutSlidesInput = {
    update: XOR<ClassUpdateWithoutSlidesInput, ClassUncheckedUpdateWithoutSlidesInput>
    create: XOR<ClassCreateWithoutSlidesInput, ClassUncheckedCreateWithoutSlidesInput>
    where?: ClassWhereInput
  }

  export type ClassUpdateToOneWithWhereWithoutSlidesInput = {
    where?: ClassWhereInput
    data: XOR<ClassUpdateWithoutSlidesInput, ClassUncheckedUpdateWithoutSlidesInput>
  }

  export type ClassUpdateWithoutSlidesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumClassStatusFieldUpdateOperationsInput | $Enums.ClassStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    course?: CourseUpdateOneRequiredWithoutClassesNestedInput
  }

  export type ClassUncheckedUpdateWithoutSlidesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumClassStatusFieldUpdateOperationsInput | $Enums.ClassStatus
    courseId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseCreateWithoutGradebookStructureInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacher: UserCreateNestedOneWithoutTeacherCoursesInput
    enrollments?: EnrollmentCreateNestedManyWithoutCourseInput
    classes?: ClassCreateNestedManyWithoutCourseInput
    periods?: PeriodCreateNestedManyWithoutCourseInput
  }

  export type CourseUncheckedCreateWithoutGradebookStructureInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    teacherId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutCourseInput
    classes?: ClassUncheckedCreateNestedManyWithoutCourseInput
    periods?: PeriodUncheckedCreateNestedManyWithoutCourseInput
  }

  export type CourseCreateOrConnectWithoutGradebookStructureInput = {
    where: CourseWhereUniqueInput
    create: XOR<CourseCreateWithoutGradebookStructureInput, CourseUncheckedCreateWithoutGradebookStructureInput>
  }

  export type AspectCreateWithoutStructureInput = {
    id?: string
    name: string
    weight: number
    indicators?: IndicatorCreateNestedManyWithoutAspectInput
  }

  export type AspectUncheckedCreateWithoutStructureInput = {
    id?: string
    name: string
    weight: number
    indicators?: IndicatorUncheckedCreateNestedManyWithoutAspectInput
  }

  export type AspectCreateOrConnectWithoutStructureInput = {
    where: AspectWhereUniqueInput
    create: XOR<AspectCreateWithoutStructureInput, AspectUncheckedCreateWithoutStructureInput>
  }

  export type AspectCreateManyStructureInputEnvelope = {
    data: AspectCreateManyStructureInput | AspectCreateManyStructureInput[]
    skipDuplicates?: boolean
  }

  export type CourseUpsertWithoutGradebookStructureInput = {
    update: XOR<CourseUpdateWithoutGradebookStructureInput, CourseUncheckedUpdateWithoutGradebookStructureInput>
    create: XOR<CourseCreateWithoutGradebookStructureInput, CourseUncheckedCreateWithoutGradebookStructureInput>
    where?: CourseWhereInput
  }

  export type CourseUpdateToOneWithWhereWithoutGradebookStructureInput = {
    where?: CourseWhereInput
    data: XOR<CourseUpdateWithoutGradebookStructureInput, CourseUncheckedUpdateWithoutGradebookStructureInput>
  }

  export type CourseUpdateWithoutGradebookStructureInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacher?: UserUpdateOneRequiredWithoutTeacherCoursesNestedInput
    enrollments?: EnrollmentUpdateManyWithoutCourseNestedInput
    classes?: ClassUpdateManyWithoutCourseNestedInput
    periods?: PeriodUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateWithoutGradebookStructureInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    teacherId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    enrollments?: EnrollmentUncheckedUpdateManyWithoutCourseNestedInput
    classes?: ClassUncheckedUpdateManyWithoutCourseNestedInput
    periods?: PeriodUncheckedUpdateManyWithoutCourseNestedInput
  }

  export type AspectUpsertWithWhereUniqueWithoutStructureInput = {
    where: AspectWhereUniqueInput
    update: XOR<AspectUpdateWithoutStructureInput, AspectUncheckedUpdateWithoutStructureInput>
    create: XOR<AspectCreateWithoutStructureInput, AspectUncheckedCreateWithoutStructureInput>
  }

  export type AspectUpdateWithWhereUniqueWithoutStructureInput = {
    where: AspectWhereUniqueInput
    data: XOR<AspectUpdateWithoutStructureInput, AspectUncheckedUpdateWithoutStructureInput>
  }

  export type AspectUpdateManyWithWhereWithoutStructureInput = {
    where: AspectScalarWhereInput
    data: XOR<AspectUpdateManyMutationInput, AspectUncheckedUpdateManyWithoutStructureInput>
  }

  export type AspectScalarWhereInput = {
    AND?: AspectScalarWhereInput | AspectScalarWhereInput[]
    OR?: AspectScalarWhereInput[]
    NOT?: AspectScalarWhereInput | AspectScalarWhereInput[]
    id?: StringFilter<"Aspect"> | string
    name?: StringFilter<"Aspect"> | string
    weight?: FloatFilter<"Aspect"> | number
    structureId?: StringFilter<"Aspect"> | string
  }

  export type GradebookStructureCreateWithoutAspectsInput = {
    id?: string
    course: CourseCreateNestedOneWithoutGradebookStructureInput
  }

  export type GradebookStructureUncheckedCreateWithoutAspectsInput = {
    id?: string
    courseId: string
  }

  export type GradebookStructureCreateOrConnectWithoutAspectsInput = {
    where: GradebookStructureWhereUniqueInput
    create: XOR<GradebookStructureCreateWithoutAspectsInput, GradebookStructureUncheckedCreateWithoutAspectsInput>
  }

  export type IndicatorCreateWithoutAspectInput = {
    id?: string
    name: string
    weight: number
    activities?: ActivityCreateNestedManyWithoutIndicatorInput
  }

  export type IndicatorUncheckedCreateWithoutAspectInput = {
    id?: string
    name: string
    weight: number
    activities?: ActivityUncheckedCreateNestedManyWithoutIndicatorInput
  }

  export type IndicatorCreateOrConnectWithoutAspectInput = {
    where: IndicatorWhereUniqueInput
    create: XOR<IndicatorCreateWithoutAspectInput, IndicatorUncheckedCreateWithoutAspectInput>
  }

  export type IndicatorCreateManyAspectInputEnvelope = {
    data: IndicatorCreateManyAspectInput | IndicatorCreateManyAspectInput[]
    skipDuplicates?: boolean
  }

  export type GradebookStructureUpsertWithoutAspectsInput = {
    update: XOR<GradebookStructureUpdateWithoutAspectsInput, GradebookStructureUncheckedUpdateWithoutAspectsInput>
    create: XOR<GradebookStructureCreateWithoutAspectsInput, GradebookStructureUncheckedCreateWithoutAspectsInput>
    where?: GradebookStructureWhereInput
  }

  export type GradebookStructureUpdateToOneWithWhereWithoutAspectsInput = {
    where?: GradebookStructureWhereInput
    data: XOR<GradebookStructureUpdateWithoutAspectsInput, GradebookStructureUncheckedUpdateWithoutAspectsInput>
  }

  export type GradebookStructureUpdateWithoutAspectsInput = {
    id?: StringFieldUpdateOperationsInput | string
    course?: CourseUpdateOneRequiredWithoutGradebookStructureNestedInput
  }

  export type GradebookStructureUncheckedUpdateWithoutAspectsInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
  }

  export type IndicatorUpsertWithWhereUniqueWithoutAspectInput = {
    where: IndicatorWhereUniqueInput
    update: XOR<IndicatorUpdateWithoutAspectInput, IndicatorUncheckedUpdateWithoutAspectInput>
    create: XOR<IndicatorCreateWithoutAspectInput, IndicatorUncheckedCreateWithoutAspectInput>
  }

  export type IndicatorUpdateWithWhereUniqueWithoutAspectInput = {
    where: IndicatorWhereUniqueInput
    data: XOR<IndicatorUpdateWithoutAspectInput, IndicatorUncheckedUpdateWithoutAspectInput>
  }

  export type IndicatorUpdateManyWithWhereWithoutAspectInput = {
    where: IndicatorScalarWhereInput
    data: XOR<IndicatorUpdateManyMutationInput, IndicatorUncheckedUpdateManyWithoutAspectInput>
  }

  export type IndicatorScalarWhereInput = {
    AND?: IndicatorScalarWhereInput | IndicatorScalarWhereInput[]
    OR?: IndicatorScalarWhereInput[]
    NOT?: IndicatorScalarWhereInput | IndicatorScalarWhereInput[]
    id?: StringFilter<"Indicator"> | string
    name?: StringFilter<"Indicator"> | string
    weight?: FloatFilter<"Indicator"> | number
    aspectId?: StringFilter<"Indicator"> | string
  }

  export type AspectCreateWithoutIndicatorsInput = {
    id?: string
    name: string
    weight: number
    structure: GradebookStructureCreateNestedOneWithoutAspectsInput
  }

  export type AspectUncheckedCreateWithoutIndicatorsInput = {
    id?: string
    name: string
    weight: number
    structureId: string
  }

  export type AspectCreateOrConnectWithoutIndicatorsInput = {
    where: AspectWhereUniqueInput
    create: XOR<AspectCreateWithoutIndicatorsInput, AspectUncheckedCreateWithoutIndicatorsInput>
  }

  export type ActivityCreateWithoutIndicatorInput = {
    id?: string
    name: string
    weight: number
    maxScore?: number
    gradeEntries?: GradeEntryCreateNestedManyWithoutActivityInput
  }

  export type ActivityUncheckedCreateWithoutIndicatorInput = {
    id?: string
    name: string
    weight: number
    maxScore?: number
    gradeEntries?: GradeEntryUncheckedCreateNestedManyWithoutActivityInput
  }

  export type ActivityCreateOrConnectWithoutIndicatorInput = {
    where: ActivityWhereUniqueInput
    create: XOR<ActivityCreateWithoutIndicatorInput, ActivityUncheckedCreateWithoutIndicatorInput>
  }

  export type ActivityCreateManyIndicatorInputEnvelope = {
    data: ActivityCreateManyIndicatorInput | ActivityCreateManyIndicatorInput[]
    skipDuplicates?: boolean
  }

  export type AspectUpsertWithoutIndicatorsInput = {
    update: XOR<AspectUpdateWithoutIndicatorsInput, AspectUncheckedUpdateWithoutIndicatorsInput>
    create: XOR<AspectCreateWithoutIndicatorsInput, AspectUncheckedCreateWithoutIndicatorsInput>
    where?: AspectWhereInput
  }

  export type AspectUpdateToOneWithWhereWithoutIndicatorsInput = {
    where?: AspectWhereInput
    data: XOR<AspectUpdateWithoutIndicatorsInput, AspectUncheckedUpdateWithoutIndicatorsInput>
  }

  export type AspectUpdateWithoutIndicatorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    structure?: GradebookStructureUpdateOneRequiredWithoutAspectsNestedInput
  }

  export type AspectUncheckedUpdateWithoutIndicatorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    structureId?: StringFieldUpdateOperationsInput | string
  }

  export type ActivityUpsertWithWhereUniqueWithoutIndicatorInput = {
    where: ActivityWhereUniqueInput
    update: XOR<ActivityUpdateWithoutIndicatorInput, ActivityUncheckedUpdateWithoutIndicatorInput>
    create: XOR<ActivityCreateWithoutIndicatorInput, ActivityUncheckedCreateWithoutIndicatorInput>
  }

  export type ActivityUpdateWithWhereUniqueWithoutIndicatorInput = {
    where: ActivityWhereUniqueInput
    data: XOR<ActivityUpdateWithoutIndicatorInput, ActivityUncheckedUpdateWithoutIndicatorInput>
  }

  export type ActivityUpdateManyWithWhereWithoutIndicatorInput = {
    where: ActivityScalarWhereInput
    data: XOR<ActivityUpdateManyMutationInput, ActivityUncheckedUpdateManyWithoutIndicatorInput>
  }

  export type ActivityScalarWhereInput = {
    AND?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
    OR?: ActivityScalarWhereInput[]
    NOT?: ActivityScalarWhereInput | ActivityScalarWhereInput[]
    id?: StringFilter<"Activity"> | string
    name?: StringFilter<"Activity"> | string
    weight?: FloatFilter<"Activity"> | number
    maxScore?: FloatFilter<"Activity"> | number
    indicatorId?: StringFilter<"Activity"> | string
  }

  export type IndicatorCreateWithoutActivitiesInput = {
    id?: string
    name: string
    weight: number
    aspect: AspectCreateNestedOneWithoutIndicatorsInput
  }

  export type IndicatorUncheckedCreateWithoutActivitiesInput = {
    id?: string
    name: string
    weight: number
    aspectId: string
  }

  export type IndicatorCreateOrConnectWithoutActivitiesInput = {
    where: IndicatorWhereUniqueInput
    create: XOR<IndicatorCreateWithoutActivitiesInput, IndicatorUncheckedCreateWithoutActivitiesInput>
  }

  export type GradeEntryCreateWithoutActivityInput = {
    id?: string
    score: number
    feedback?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutGradebookEntriesInput
    period: PeriodCreateNestedOneWithoutGradeEntriesInput
  }

  export type GradeEntryUncheckedCreateWithoutActivityInput = {
    id?: string
    score: number
    feedback?: string | null
    userId: string
    periodId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GradeEntryCreateOrConnectWithoutActivityInput = {
    where: GradeEntryWhereUniqueInput
    create: XOR<GradeEntryCreateWithoutActivityInput, GradeEntryUncheckedCreateWithoutActivityInput>
  }

  export type GradeEntryCreateManyActivityInputEnvelope = {
    data: GradeEntryCreateManyActivityInput | GradeEntryCreateManyActivityInput[]
    skipDuplicates?: boolean
  }

  export type IndicatorUpsertWithoutActivitiesInput = {
    update: XOR<IndicatorUpdateWithoutActivitiesInput, IndicatorUncheckedUpdateWithoutActivitiesInput>
    create: XOR<IndicatorCreateWithoutActivitiesInput, IndicatorUncheckedCreateWithoutActivitiesInput>
    where?: IndicatorWhereInput
  }

  export type IndicatorUpdateToOneWithWhereWithoutActivitiesInput = {
    where?: IndicatorWhereInput
    data: XOR<IndicatorUpdateWithoutActivitiesInput, IndicatorUncheckedUpdateWithoutActivitiesInput>
  }

  export type IndicatorUpdateWithoutActivitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    aspect?: AspectUpdateOneRequiredWithoutIndicatorsNestedInput
  }

  export type IndicatorUncheckedUpdateWithoutActivitiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    aspectId?: StringFieldUpdateOperationsInput | string
  }

  export type GradeEntryUpsertWithWhereUniqueWithoutActivityInput = {
    where: GradeEntryWhereUniqueInput
    update: XOR<GradeEntryUpdateWithoutActivityInput, GradeEntryUncheckedUpdateWithoutActivityInput>
    create: XOR<GradeEntryCreateWithoutActivityInput, GradeEntryUncheckedCreateWithoutActivityInput>
  }

  export type GradeEntryUpdateWithWhereUniqueWithoutActivityInput = {
    where: GradeEntryWhereUniqueInput
    data: XOR<GradeEntryUpdateWithoutActivityInput, GradeEntryUncheckedUpdateWithoutActivityInput>
  }

  export type GradeEntryUpdateManyWithWhereWithoutActivityInput = {
    where: GradeEntryScalarWhereInput
    data: XOR<GradeEntryUpdateManyMutationInput, GradeEntryUncheckedUpdateManyWithoutActivityInput>
  }

  export type UserCreateWithoutGradebookEntriesInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseCreateNestedManyWithoutTeacherInput
    enrollments?: EnrollmentCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationCreateNestedManyWithoutEvaluatorInput
    peerEvaluationsReceived?: PeerEvaluationCreateNestedManyWithoutEvaluatedInput
  }

  export type UserUncheckedCreateWithoutGradebookEntriesInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseUncheckedCreateNestedManyWithoutTeacherInput
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationUncheckedCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatorInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatedInput
  }

  export type UserCreateOrConnectWithoutGradebookEntriesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutGradebookEntriesInput, UserUncheckedCreateWithoutGradebookEntriesInput>
  }

  export type ActivityCreateWithoutGradeEntriesInput = {
    id?: string
    name: string
    weight: number
    maxScore?: number
    indicator: IndicatorCreateNestedOneWithoutActivitiesInput
  }

  export type ActivityUncheckedCreateWithoutGradeEntriesInput = {
    id?: string
    name: string
    weight: number
    maxScore?: number
    indicatorId: string
  }

  export type ActivityCreateOrConnectWithoutGradeEntriesInput = {
    where: ActivityWhereUniqueInput
    create: XOR<ActivityCreateWithoutGradeEntriesInput, ActivityUncheckedCreateWithoutGradeEntriesInput>
  }

  export type PeriodCreateWithoutGradeEntriesInput = {
    id?: string
    name: string
    startDate: Date | string
    endDate: Date | string
    isActive?: boolean
    createdAt?: Date | string
    course: CourseCreateNestedOneWithoutPeriodsInput
  }

  export type PeriodUncheckedCreateWithoutGradeEntriesInput = {
    id?: string
    name: string
    startDate: Date | string
    endDate: Date | string
    isActive?: boolean
    courseId: string
    createdAt?: Date | string
  }

  export type PeriodCreateOrConnectWithoutGradeEntriesInput = {
    where: PeriodWhereUniqueInput
    create: XOR<PeriodCreateWithoutGradeEntriesInput, PeriodUncheckedCreateWithoutGradeEntriesInput>
  }

  export type UserUpsertWithoutGradebookEntriesInput = {
    update: XOR<UserUpdateWithoutGradebookEntriesInput, UserUncheckedUpdateWithoutGradebookEntriesInput>
    create: XOR<UserCreateWithoutGradebookEntriesInput, UserUncheckedCreateWithoutGradebookEntriesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutGradebookEntriesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutGradebookEntriesInput, UserUncheckedUpdateWithoutGradebookEntriesInput>
  }

  export type UserUpdateWithoutGradebookEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUpdateManyWithoutTeacherNestedInput
    enrollments?: EnrollmentUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUpdateManyWithoutEvaluatorNestedInput
    peerEvaluationsReceived?: PeerEvaluationUpdateManyWithoutEvaluatedNestedInput
  }

  export type UserUncheckedUpdateWithoutGradebookEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUncheckedUpdateManyWithoutTeacherNestedInput
    enrollments?: EnrollmentUncheckedUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUncheckedUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatorNestedInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatedNestedInput
  }

  export type ActivityUpsertWithoutGradeEntriesInput = {
    update: XOR<ActivityUpdateWithoutGradeEntriesInput, ActivityUncheckedUpdateWithoutGradeEntriesInput>
    create: XOR<ActivityCreateWithoutGradeEntriesInput, ActivityUncheckedCreateWithoutGradeEntriesInput>
    where?: ActivityWhereInput
  }

  export type ActivityUpdateToOneWithWhereWithoutGradeEntriesInput = {
    where?: ActivityWhereInput
    data: XOR<ActivityUpdateWithoutGradeEntriesInput, ActivityUncheckedUpdateWithoutGradeEntriesInput>
  }

  export type ActivityUpdateWithoutGradeEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    maxScore?: FloatFieldUpdateOperationsInput | number
    indicator?: IndicatorUpdateOneRequiredWithoutActivitiesNestedInput
  }

  export type ActivityUncheckedUpdateWithoutGradeEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    maxScore?: FloatFieldUpdateOperationsInput | number
    indicatorId?: StringFieldUpdateOperationsInput | string
  }

  export type PeriodUpsertWithoutGradeEntriesInput = {
    update: XOR<PeriodUpdateWithoutGradeEntriesInput, PeriodUncheckedUpdateWithoutGradeEntriesInput>
    create: XOR<PeriodCreateWithoutGradeEntriesInput, PeriodUncheckedCreateWithoutGradeEntriesInput>
    where?: PeriodWhereInput
  }

  export type PeriodUpdateToOneWithWhereWithoutGradeEntriesInput = {
    where?: PeriodWhereInput
    data: XOR<PeriodUpdateWithoutGradeEntriesInput, PeriodUncheckedUpdateWithoutGradeEntriesInput>
  }

  export type PeriodUpdateWithoutGradeEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    course?: CourseUpdateOneRequiredWithoutPeriodsNestedInput
  }

  export type PeriodUncheckedUpdateWithoutGradeEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    courseId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateWithoutSelfEvaluationsInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseCreateNestedManyWithoutTeacherInput
    enrollments?: EnrollmentCreateNestedManyWithoutUserInput
    gradebookEntries?: GradeEntryCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationCreateNestedManyWithoutEvaluatorInput
    peerEvaluationsReceived?: PeerEvaluationCreateNestedManyWithoutEvaluatedInput
  }

  export type UserUncheckedCreateWithoutSelfEvaluationsInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseUncheckedCreateNestedManyWithoutTeacherInput
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutUserInput
    gradebookEntries?: GradeEntryUncheckedCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatorInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatedInput
  }

  export type UserCreateOrConnectWithoutSelfEvaluationsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSelfEvaluationsInput, UserUncheckedCreateWithoutSelfEvaluationsInput>
  }

  export type UserUpsertWithoutSelfEvaluationsInput = {
    update: XOR<UserUpdateWithoutSelfEvaluationsInput, UserUncheckedUpdateWithoutSelfEvaluationsInput>
    create: XOR<UserCreateWithoutSelfEvaluationsInput, UserUncheckedCreateWithoutSelfEvaluationsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSelfEvaluationsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSelfEvaluationsInput, UserUncheckedUpdateWithoutSelfEvaluationsInput>
  }

  export type UserUpdateWithoutSelfEvaluationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUpdateManyWithoutTeacherNestedInput
    enrollments?: EnrollmentUpdateManyWithoutUserNestedInput
    gradebookEntries?: GradeEntryUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUpdateManyWithoutEvaluatorNestedInput
    peerEvaluationsReceived?: PeerEvaluationUpdateManyWithoutEvaluatedNestedInput
  }

  export type UserUncheckedUpdateWithoutSelfEvaluationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUncheckedUpdateManyWithoutTeacherNestedInput
    enrollments?: EnrollmentUncheckedUpdateManyWithoutUserNestedInput
    gradebookEntries?: GradeEntryUncheckedUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatorNestedInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatedNestedInput
  }

  export type UserCreateWithoutPeerEvaluationsGivenInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseCreateNestedManyWithoutTeacherInput
    enrollments?: EnrollmentCreateNestedManyWithoutUserInput
    gradebookEntries?: GradeEntryCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationCreateNestedManyWithoutUserInput
    peerEvaluationsReceived?: PeerEvaluationCreateNestedManyWithoutEvaluatedInput
  }

  export type UserUncheckedCreateWithoutPeerEvaluationsGivenInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseUncheckedCreateNestedManyWithoutTeacherInput
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutUserInput
    gradebookEntries?: GradeEntryUncheckedCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationUncheckedCreateNestedManyWithoutUserInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatedInput
  }

  export type UserCreateOrConnectWithoutPeerEvaluationsGivenInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPeerEvaluationsGivenInput, UserUncheckedCreateWithoutPeerEvaluationsGivenInput>
  }

  export type UserCreateWithoutPeerEvaluationsReceivedInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseCreateNestedManyWithoutTeacherInput
    enrollments?: EnrollmentCreateNestedManyWithoutUserInput
    gradebookEntries?: GradeEntryCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationCreateNestedManyWithoutEvaluatorInput
  }

  export type UserUncheckedCreateWithoutPeerEvaluationsReceivedInput = {
    id?: string
    email: string
    password: string
    name: string
    lastName: string
    role?: $Enums.Role
    avatar?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    teacherCourses?: CourseUncheckedCreateNestedManyWithoutTeacherInput
    enrollments?: EnrollmentUncheckedCreateNestedManyWithoutUserInput
    gradebookEntries?: GradeEntryUncheckedCreateNestedManyWithoutUserInput
    selfEvaluations?: SelfEvaluationUncheckedCreateNestedManyWithoutUserInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedCreateNestedManyWithoutEvaluatorInput
  }

  export type UserCreateOrConnectWithoutPeerEvaluationsReceivedInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPeerEvaluationsReceivedInput, UserUncheckedCreateWithoutPeerEvaluationsReceivedInput>
  }

  export type UserUpsertWithoutPeerEvaluationsGivenInput = {
    update: XOR<UserUpdateWithoutPeerEvaluationsGivenInput, UserUncheckedUpdateWithoutPeerEvaluationsGivenInput>
    create: XOR<UserCreateWithoutPeerEvaluationsGivenInput, UserUncheckedCreateWithoutPeerEvaluationsGivenInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPeerEvaluationsGivenInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPeerEvaluationsGivenInput, UserUncheckedUpdateWithoutPeerEvaluationsGivenInput>
  }

  export type UserUpdateWithoutPeerEvaluationsGivenInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUpdateManyWithoutTeacherNestedInput
    enrollments?: EnrollmentUpdateManyWithoutUserNestedInput
    gradebookEntries?: GradeEntryUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUpdateManyWithoutUserNestedInput
    peerEvaluationsReceived?: PeerEvaluationUpdateManyWithoutEvaluatedNestedInput
  }

  export type UserUncheckedUpdateWithoutPeerEvaluationsGivenInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUncheckedUpdateManyWithoutTeacherNestedInput
    enrollments?: EnrollmentUncheckedUpdateManyWithoutUserNestedInput
    gradebookEntries?: GradeEntryUncheckedUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUncheckedUpdateManyWithoutUserNestedInput
    peerEvaluationsReceived?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatedNestedInput
  }

  export type UserUpsertWithoutPeerEvaluationsReceivedInput = {
    update: XOR<UserUpdateWithoutPeerEvaluationsReceivedInput, UserUncheckedUpdateWithoutPeerEvaluationsReceivedInput>
    create: XOR<UserCreateWithoutPeerEvaluationsReceivedInput, UserUncheckedCreateWithoutPeerEvaluationsReceivedInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPeerEvaluationsReceivedInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPeerEvaluationsReceivedInput, UserUncheckedUpdateWithoutPeerEvaluationsReceivedInput>
  }

  export type UserUpdateWithoutPeerEvaluationsReceivedInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUpdateManyWithoutTeacherNestedInput
    enrollments?: EnrollmentUpdateManyWithoutUserNestedInput
    gradebookEntries?: GradeEntryUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUpdateManyWithoutEvaluatorNestedInput
  }

  export type UserUncheckedUpdateWithoutPeerEvaluationsReceivedInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    teacherCourses?: CourseUncheckedUpdateManyWithoutTeacherNestedInput
    enrollments?: EnrollmentUncheckedUpdateManyWithoutUserNestedInput
    gradebookEntries?: GradeEntryUncheckedUpdateManyWithoutUserNestedInput
    selfEvaluations?: SelfEvaluationUncheckedUpdateManyWithoutUserNestedInput
    peerEvaluationsGiven?: PeerEvaluationUncheckedUpdateManyWithoutEvaluatorNestedInput
  }

  export type CourseCreateManyTeacherInput = {
    id?: string
    name: string
    description?: string | null
    code: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EnrollmentCreateManyUserInput = {
    id?: string
    courseId: string
    createdAt?: Date | string
  }

  export type GradeEntryCreateManyUserInput = {
    id?: string
    score: number
    feedback?: string | null
    activityId: string
    periodId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SelfEvaluationCreateManyUserInput = {
    id?: string
    score: number
    feedback?: string | null
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type PeerEvaluationCreateManyEvaluatorInput = {
    id?: string
    score: number
    feedback?: string | null
    evaluatedId: string
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type PeerEvaluationCreateManyEvaluatedInput = {
    id?: string
    score: number
    feedback?: string | null
    evaluatorId: string
    courseId: string
    periodId: string
    createdAt?: Date | string
  }

  export type CourseUpdateWithoutTeacherInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    enrollments?: EnrollmentUpdateManyWithoutCourseNestedInput
    classes?: ClassUpdateManyWithoutCourseNestedInput
    gradebookStructure?: GradebookStructureUpdateOneWithoutCourseNestedInput
    periods?: PeriodUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateWithoutTeacherInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    enrollments?: EnrollmentUncheckedUpdateManyWithoutCourseNestedInput
    classes?: ClassUncheckedUpdateManyWithoutCourseNestedInput
    gradebookStructure?: GradebookStructureUncheckedUpdateOneWithoutCourseNestedInput
    periods?: PeriodUncheckedUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateManyWithoutTeacherInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EnrollmentUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    course?: CourseUpdateOneRequiredWithoutEnrollmentsNestedInput
  }

  export type EnrollmentUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EnrollmentUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GradeEntryUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    activity?: ActivityUpdateOneRequiredWithoutGradeEntriesNestedInput
    period?: PeriodUpdateOneRequiredWithoutGradeEntriesNestedInput
  }

  export type GradeEntryUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    activityId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GradeEntryUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    activityId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SelfEvaluationUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SelfEvaluationUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SelfEvaluationUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PeerEvaluationUpdateWithoutEvaluatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    evaluated?: UserUpdateOneRequiredWithoutPeerEvaluationsReceivedNestedInput
  }

  export type PeerEvaluationUncheckedUpdateWithoutEvaluatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    evaluatedId?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PeerEvaluationUncheckedUpdateManyWithoutEvaluatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    evaluatedId?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PeerEvaluationUpdateWithoutEvaluatedInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    evaluator?: UserUpdateOneRequiredWithoutPeerEvaluationsGivenNestedInput
  }

  export type PeerEvaluationUncheckedUpdateWithoutEvaluatedInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    evaluatorId?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PeerEvaluationUncheckedUpdateManyWithoutEvaluatedInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    evaluatorId?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EnrollmentCreateManyCourseInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type ClassCreateManyCourseInput = {
    id?: string
    title: string
    description?: string | null
    code: string
    status?: $Enums.ClassStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PeriodCreateManyCourseInput = {
    id?: string
    name: string
    startDate: Date | string
    endDate: Date | string
    isActive?: boolean
    createdAt?: Date | string
  }

  export type EnrollmentUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutEnrollmentsNestedInput
  }

  export type EnrollmentUncheckedUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EnrollmentUncheckedUpdateManyWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ClassUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumClassStatusFieldUpdateOperationsInput | $Enums.ClassStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    slides?: SlideUpdateManyWithoutClassNestedInput
  }

  export type ClassUncheckedUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumClassStatusFieldUpdateOperationsInput | $Enums.ClassStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    slides?: SlideUncheckedUpdateManyWithoutClassNestedInput
  }

  export type ClassUncheckedUpdateManyWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumClassStatusFieldUpdateOperationsInput | $Enums.ClassStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PeriodUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gradeEntries?: GradeEntryUpdateManyWithoutPeriodNestedInput
  }

  export type PeriodUncheckedUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    gradeEntries?: GradeEntryUncheckedUpdateManyWithoutPeriodNestedInput
  }

  export type PeriodUncheckedUpdateManyWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GradeEntryCreateManyPeriodInput = {
    id?: string
    score: number
    feedback?: string | null
    userId: string
    activityId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GradeEntryUpdateWithoutPeriodInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutGradebookEntriesNestedInput
    activity?: ActivityUpdateOneRequiredWithoutGradeEntriesNestedInput
  }

  export type GradeEntryUncheckedUpdateWithoutPeriodInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    activityId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GradeEntryUncheckedUpdateManyWithoutPeriodInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    activityId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SlideCreateManyClassInput = {
    id?: string
    order: number
    type: $Enums.SlideType
    title: string
    content?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SlideUpdateWithoutClassInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    type?: EnumSlideTypeFieldUpdateOperationsInput | $Enums.SlideType
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SlideUncheckedUpdateWithoutClassInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    type?: EnumSlideTypeFieldUpdateOperationsInput | $Enums.SlideType
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SlideUncheckedUpdateManyWithoutClassInput = {
    id?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    type?: EnumSlideTypeFieldUpdateOperationsInput | $Enums.SlideType
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AspectCreateManyStructureInput = {
    id?: string
    name: string
    weight: number
  }

  export type AspectUpdateWithoutStructureInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    indicators?: IndicatorUpdateManyWithoutAspectNestedInput
  }

  export type AspectUncheckedUpdateWithoutStructureInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    indicators?: IndicatorUncheckedUpdateManyWithoutAspectNestedInput
  }

  export type AspectUncheckedUpdateManyWithoutStructureInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
  }

  export type IndicatorCreateManyAspectInput = {
    id?: string
    name: string
    weight: number
  }

  export type IndicatorUpdateWithoutAspectInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    activities?: ActivityUpdateManyWithoutIndicatorNestedInput
  }

  export type IndicatorUncheckedUpdateWithoutAspectInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    activities?: ActivityUncheckedUpdateManyWithoutIndicatorNestedInput
  }

  export type IndicatorUncheckedUpdateManyWithoutAspectInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
  }

  export type ActivityCreateManyIndicatorInput = {
    id?: string
    name: string
    weight: number
    maxScore?: number
  }

  export type ActivityUpdateWithoutIndicatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    maxScore?: FloatFieldUpdateOperationsInput | number
    gradeEntries?: GradeEntryUpdateManyWithoutActivityNestedInput
  }

  export type ActivityUncheckedUpdateWithoutIndicatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    maxScore?: FloatFieldUpdateOperationsInput | number
    gradeEntries?: GradeEntryUncheckedUpdateManyWithoutActivityNestedInput
  }

  export type ActivityUncheckedUpdateManyWithoutIndicatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    weight?: FloatFieldUpdateOperationsInput | number
    maxScore?: FloatFieldUpdateOperationsInput | number
  }

  export type GradeEntryCreateManyActivityInput = {
    id?: string
    score: number
    feedback?: string | null
    userId: string
    periodId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type GradeEntryUpdateWithoutActivityInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutGradebookEntriesNestedInput
    period?: PeriodUpdateOneRequiredWithoutGradeEntriesNestedInput
  }

  export type GradeEntryUncheckedUpdateWithoutActivityInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GradeEntryUncheckedUpdateManyWithoutActivityInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    feedback?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    periodId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}