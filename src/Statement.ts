import { NotSupportedOperationError } from "./errors";
import { ResultSet } from "./ResultSet";
import { FunctionCode, ObjValueTuple } from "./types";

/**
 * @param T item type, for query only
 */
export class Statement<T = any, P extends Array<any> = Array<any>> {
  
  private _statement: any;

  /**
   * @private
   * @internal
   * @param statement 
   */
  constructor(statement: any) {
    this._statement = statement;
  }

  public get id() {
    return this?._statement?.id?.toString("hex");
  }

  public get functionCode(): FunctionCode {
    return this?._statement.functionCode;
  }
  
  /**
   * direct execute write
   * 
   * @param params each param item will contain an array, each item could be inserted to table
   * @returns affectedRows array
   * 
   * 
   * @example
   * ```ts
   * const affectedRows = await stat.write([1, "Theo"], [2, "Neo"], [3, "Nano"]);
   * expect(affectedRows).toStrictEqual([1, 1, 1]);
   * ```
   * 
   */
  public async write(...params: Array<T extends any ? any : ObjValueTuple<T>>): Promise<Array<number>> {
    return new Promise((resolve, reject) => {
      this._statement.exec(params, (err: Error, results: Array<any>) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * direct execute query
   * 
   * @param params 
   * @returns query result
   */
  public async query(...params: P): Promise<Array<T>> {
    return new Promise((resolve, reject) => {
      this._statement.exec(params, (err: Error, results: Array<any>) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * direct call proc
   * 
   * ref the [document](https://github.com/SAP/node-hdb#calling-stored-procedures)
   * 
   * @param param param map
   * @returns out parameters array
   */
  public async call(param: any): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this._statement.exec(param, (err: Error, ...results: Array<any>) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * drop the prepared statement
   * 
   * @returns 
   */
  public async drop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._statement.drop((err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  }

  /**
   * execute with param, in stream mode
   * 
   * @param params 
   * @returns result set
   * @throws {NotSupportedOperationError}
   */
  public async execute(...params: P): Promise<ResultSet<T>> {
    if (this.functionCode === FunctionCode.DB_PROCEDURE_CALL) {
      throw new NotSupportedOperationError(`not support to use 'execute' method to call procedure`);
    }
    return new Promise((resolve, reject) => {
      this._statement.execute(params, (err: Error, rs: ResultSet) => {
        if (err) {
          reject(err);
        } else {
          resolve(rs);
        }
      });
    });
  }

}
