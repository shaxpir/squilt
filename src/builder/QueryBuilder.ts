import { SelectQuery } from "../ast/SelectQuery";
import { InsertQuery } from "../ast/InsertQuery";
import { DeleteQuery } from "../ast/DeleteQuery";
import { SqlTreeNode } from "../ast/Abstractions";
import { QueryIdentityTransformer } from "../visitor/QueryIdentityTransformer";

export class QueryBuilder {

  public static select(): SelectQuery {
    return new SelectQuery();
  }

  public static insertInto(tableName: string): InsertQuery {
    return new InsertQuery(tableName);
  }

  public static deleteFrom(tableName: string): DeleteQuery {
    return new DeleteQuery(tableName);
  }

  public static clone(node:SqlTreeNode):SqlTreeNode {
    const transformer = new QueryIdentityTransformer();
    return transformer.transform(node);
  }
}
