declare module 'tablestore' {
  namespace TableStore {
    class Client {
      constructor(config: any);
      putRow(params: any): Promise<any>;
      putRow(params: any, callback: (err: any, data: any) => void): void;
      getRow(params: any): Promise<any>;
      getRow(params: any, callback: (err: any, data: any) => void): void;
      updateRow(params: any): Promise<any>;
      updateRow(params: any, callback: (err: any, data: any) => void): void;
      deleteRow(params: any): Promise<any>;
      deleteRow(params: any, callback: (err: any, data: any) => void): void;
      getRange(params: any): Promise<any>;
      getRange(params: any, callback: (err: any, data: any) => void): void;
    }
    
    class Condition {
      constructor(rowExistenceExpectation: string, columnCondition: any);
    }
    
    namespace RowExistenceExpectation {
      const IGNORE: string;
      const EXPECT_EXIST: string;
      const EXPECT_NOT_EXIST: string;
    }
    
    namespace Long {
      function fromString(str: string): any;
    }
    
    namespace Filter {
      class SingleColumnValueFilter {
        constructor(...args: any[]);
      }
      enum ComparatorType {}
      enum LogicalOperator {}
      enum CompareOperator {}
    }
  }
  
  export = TableStore;
}
