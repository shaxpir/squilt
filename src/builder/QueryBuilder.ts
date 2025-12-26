import { SelectQuery } from "../ast/SelectQuery";
import { InsertQuery } from "../ast/InsertQuery";
import { UpdateQuery } from "../ast/UpdateQuery";
import { DeleteQuery } from "../ast/DeleteQuery";
import { CreateTableQuery } from "../ast/CreateTableQuery";
import { CreateIndexQuery } from "../ast/CreateIndexQuery";
import { CreateViewQuery } from "../ast/CreateViewQuery";
import { AlterTableQuery } from "../ast/AlterTableQuery";
import { DropTableQuery } from "../ast/DropTableQuery";
import { DropIndexQuery } from "../ast/DropIndexQuery";
import { DropViewQuery } from "../ast/DropViewQuery";
import { SqlTreeNode } from "../ast/Abstractions";
import { QueryIdentityTransformer } from "../visitor/QueryIdentityTransformer";

export class QueryBuilder {

  public static select(): SelectQuery {
    return new SelectQuery();
  }

  public static insertInto(tableName: string): InsertQuery {
    return new InsertQuery(tableName);
  }

  public static update(tableName: string): UpdateQuery {
    return new UpdateQuery(tableName);
  }

  public static deleteFrom(tableName: string): DeleteQuery {
    return new DeleteQuery(tableName);
  }

  public static createTable(tableName: string): CreateTableQuery {
    return new CreateTableQuery(tableName);
  }

  public static createIndex(indexName: string): CreateIndexQuery {
    return new CreateIndexQuery(indexName);
  }

  public static alterTable(tableName: string): AlterTableQuery {
    return new AlterTableQuery(tableName);
  }

  public static dropTable(tableName: string): DropTableQuery {
    return new DropTableQuery(tableName);
  }

  public static dropIndex(indexName: string): DropIndexQuery {
    return new DropIndexQuery(indexName);
  }

  public static createView(viewName: string): CreateViewQuery {
    return new CreateViewQuery(viewName);
  }

  public static dropView(viewName: string): DropViewQuery {
    return new DropViewQuery(viewName);
  }

  public static clone(node:SqlTreeNode):SqlTreeNode {
    const transformer = new QueryIdentityTransformer();
    return transformer.transform(node);
  }
}
