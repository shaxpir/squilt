import { Alias } from '../../src/ast/Alias';
import { BinaryExpression } from '../../src/ast/BinaryExpression';
import { Column } from '../../src/ast/Column';
import { TableFrom } from '../../src/ast/From';
import { Param } from '../../src/ast/Literals';
import { Operator } from '../../src/ast/Operator';
import { SelectQuery } from '../../src/ast/SelectQuery';
import { COLUMN, FROM, GT, PARAM, SELECT } from '../../src/builder/Shorthand';
import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';

// NOTE: no compact or indented query expected here, because the query is not valid
describe('Select Query with Missing Parameter', () => {

  test('throws error for missing parameter value', () => {
    const query = SelectQuery.create()
      .from(new Alias(new TableFrom('products'), 'p'))
      .column(new Column('name'))
      .where(
        new BinaryExpression(
          new Column('p', 'price'),
          Operator.GREATER_THAN,
          new Param('minPrice')
        )
      );

    const keyValuePairs = {
      otherParam: 100,
    };

    const paramCollector = new ParamCollectingVisitor(keyValuePairs);

    expect(() => query.accept(paramCollector)).toThrow('No value provided for parameter: minPrice');
  });

  test('throws error for missing parameter value using Shorthand API', () => {
    const query = SELECT(
      FROM('products').as('p'),
      COLUMN('name'))
      .where(
        GT(COLUMN('p', 'price'), PARAM('minPrice'))
      );

    const keyValuePairs = {
      otherParam: 100,
    };

    const paramCollector = new ParamCollectingVisitor(keyValuePairs);

    expect(() => query.accept(paramCollector)).toThrow('No value provided for parameter: minPrice');
  });
});