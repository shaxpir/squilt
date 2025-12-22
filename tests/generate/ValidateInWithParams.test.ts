import { ParamCollectingVisitor } from '../../src/visitor/ParamCollector';
import { COLUMN, FROM, IN, PARAM, SELECT } from '../../src/builder/Shorthand';
import { CommonQueryValidator } from '../../src/validate/CommonQueryValidator';
import { SQLiteQueryValidator } from '../../src/validate/SQLiteQueryValidator';

describe('Validate and Collect Params for IN', () => {
  test('IN with params validates and collects correctly', () => {
    const query = SELECT(FROM('users')).where(IN(COLUMN('id'), PARAM('id1'), PARAM('id2')));

    expect(() => query.accept(new CommonQueryValidator())).not.toThrow();
    expect(() => query.accept(new SQLiteQueryValidator())).not.toThrow();

    const keyValuePairs = { id1: 1, id2: 2 };
    const collector = new ParamCollectingVisitor(keyValuePairs);
    const params = query.accept(collector);
    expect(params).toEqual([1, 2]);
  });
});