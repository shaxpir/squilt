import { InsertQuery } from "../ast/InsertQuery";
import { SelectQuery } from "../ast/SelectQuery";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

export interface QueryValidator extends SqlTreeNodeVisitor<void> {
  validate(node: SelectQuery | InsertQuery): void;
}
