import { DeleteQuery } from "../ast/DeleteQuery";
import { InsertQuery } from "../ast/InsertQuery";
import { UpdateQuery } from "../ast/UpdateQuery";
import { SelectQuery } from "../ast/SelectQuery";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

export interface QueryValidator extends SqlTreeNodeVisitor<void> {
  validate(node: SelectQuery | InsertQuery | UpdateQuery | DeleteQuery): void;
}
