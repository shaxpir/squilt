import { SelectQuery } from "../ast/SelectQuery";
import { InsertQuery } from "../ast/InsertQuery";
import { UpdateQuery } from "../ast/UpdateQuery";
import { DeleteQuery } from "../ast/DeleteQuery";
import { DropTableQuery } from "../ast/DropTableQuery";
import { DropIndexQuery } from "../ast/DropIndexQuery";
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

  public static dropTable(tableName: string): DropTableQuery {
    return new DropTableQuery(tableName);
  }

  public static dropIndex(indexName: string): DropIndexQuery {
    return new DropIndexQuery(indexName);
  }

  public static clone(node:SqlTreeNode):SqlTreeNode {
    const transformer = new QueryIdentityTransformer();
    return transformer.transform(node);
  }
}
