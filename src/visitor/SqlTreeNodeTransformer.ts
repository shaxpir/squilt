import { SqlTreeNode } from "../ast/Abstractions";
import { SqlTreeNodeVisitor } from "./SqlTreeNodeVisitor";

export interface SqlTreeNodeTransformer extends SqlTreeNodeVisitor<SqlTreeNode | SqlTreeNode[]> {
  transform(node: SqlTreeNode): SqlTreeNode;
}
