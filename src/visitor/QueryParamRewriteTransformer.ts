import { Expression, SqlTreeNode } from "../ast/Abstractions";
import { Param } from "../ast/Literals";
import { QueryIdentityTransformer } from "./QueryIdentityTransformer";

export type ParamReplacements = {
  [paramName: string]: Expression | Expression[];
};

export class QueryParamRewriteTransformer extends QueryIdentityTransformer {
  private readonly _replacements: ParamReplacements;

  // Support both old single-param constructor and new multi-param constructor
  constructor(paramNameOrReplacements: string | ParamReplacements, replacement?: Expression | Expression[]) {
    super();
    if (typeof paramNameOrReplacements === 'string') {
      // Legacy single-parameter mode
      this._replacements = { [paramNameOrReplacements]: replacement! };
    } else {
      // New multi-parameter mode
      this._replacements = paramNameOrReplacements;
    }
  }

  override visitParamExpression(node: Param): SqlTreeNode | SqlTreeNode[] {
    if (node.paramName && this._replacements && typeof this._replacements === 'object' && node.paramName in this._replacements) {
      return this._replacements[node.paramName];
    }
    return super.visitParamExpression(node);
  }
}
