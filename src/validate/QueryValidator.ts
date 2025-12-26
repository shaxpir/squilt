import { AlterTableQuery } from "../ast/AlterTableQuery";
import { CreateIndexQuery } from "../ast/CreateIndexQuery";
import { CreateTableQuery } from "../ast/CreateTableQuery";
import { CreateViewQuery } from "../ast/CreateViewQuery";
import { DeleteQuery } from "../ast/DeleteQuery";
import { DropIndexQuery } from "../ast/DropIndexQuery";
import { DropTableQuery } from "../ast/DropTableQuery";
import { DropViewQuery } from "../ast/DropViewQuery";
import { InsertQuery } from "../ast/InsertQuery";
import { UpdateQuery } from "../ast/UpdateQuery";
import { SelectQuery } from "../ast/SelectQuery";
import { SqlTreeNodeVisitor } from "../visitor/SqlTreeNodeVisitor";

export interface QueryValidator extends SqlTreeNodeVisitor<void> {
  validate(node: SelectQuery | InsertQuery | UpdateQuery | DeleteQuery | CreateTableQuery | CreateIndexQuery | CreateViewQuery | AlterTableQuery | DropTableQuery | DropIndexQuery | DropViewQuery): void;
}
