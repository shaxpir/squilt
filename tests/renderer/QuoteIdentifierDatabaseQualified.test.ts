import { quoteIdentifier } from '../../src/renderer/QueryRenderer';

describe('Quote Identifier with Database-Qualified Names', () => {

  test('handles simple database-qualified identifiers without quoting', () => {
    expect(quoteIdentifier('userdata.progress')).toBe('userdata.progress');
    expect(quoteIdentifier('main.users')).toBe('main.users');
    expect(quoteIdentifier('db.mytable')).toBe('db.mytable'); // 'table' is reserved, use 'mytable'
  });

  test('quotes database name when it contains reserved keywords', () => {
    expect(quoteIdentifier('DATABASE.progress')).toBe('"DATABASE".progress');
    expect(quoteIdentifier('SELECT.mytable')).toBe('"SELECT".mytable');
    expect(quoteIdentifier('userdata.TABLE')).toBe('userdata."TABLE"');
  });

  test('quotes table name when it contains reserved keywords', () => {
    expect(quoteIdentifier('userdata.SELECT')).toBe('userdata."SELECT"');
    expect(quoteIdentifier('main.FROM')).toBe('main."FROM"');
    expect(quoteIdentifier('db.WHERE')).toBe('db."WHERE"');
  });

  test('quotes both parts when both are reserved keywords', () => {
    expect(quoteIdentifier('DATABASE.TABLE')).toBe('"DATABASE"."TABLE"');
    expect(quoteIdentifier('SELECT.FROM')).toBe('"SELECT"."FROM"');
  });

  test('quotes parts with special characters', () => {
    expect(quoteIdentifier('user data.my table')).toBe('"user data"."my table"');
    expect(quoteIdentifier('db-name.table-name')).toBe('"db-name"."table-name"');
    expect(quoteIdentifier('123db.456table')).toBe('"123db"."456table"');
  });

  test('handles case sensitivity by quoting uppercase identifiers', () => {
    expect(quoteIdentifier('UserData.Progress')).toBe('"UserData"."Progress"');
    expect(quoteIdentifier('MAIN.users')).toBe('"MAIN".users');
    expect(quoteIdentifier('userdata.PROGRESS')).toBe('userdata."PROGRESS"');
  });

  test('escapes double quotes in identifiers', () => {
    expect(quoteIdentifier('user"data.prog"ress')).toBe('"user""data"."prog""ress"');
    expect(quoteIdentifier('my"db.my"table')).toBe('"my""db"."my""table"');
  });

  test('maintains backward compatibility with single identifiers', () => {
    // Simple identifiers (no dots)
    expect(quoteIdentifier('users')).toBe('users');
    expect(quoteIdentifier('TABLE')).toBe('"TABLE"'); // Reserved keyword
    expect(quoteIdentifier('user name')).toBe('"user name"'); // Space
    expect(quoteIdentifier('123table')).toBe('"123table"'); // Starts with number
  });

  test('handles special case of asterisk', () => {
    expect(quoteIdentifier('*')).toBe('*');
    expect(quoteIdentifier('userdata.*')).toBe('userdata.*'); // Should this be userdata."*"?
  });

  test('handles more than two parts gracefully', () => {
    // More than 2 parts should fall back to original behavior
    expect(quoteIdentifier('db.schema.table')).toBe('"db.schema.table"');
    expect(quoteIdentifier('a.b.c.d')).toBe('"a.b.c.d"');
  });

  test('handles edge cases', () => {
    expect(quoteIdentifier('')).toBe('""'); // Empty string
    expect(quoteIdentifier('.')).toBe('"".""'); // Just a dot splits into two empty parts
    expect(quoteIdentifier('a.')).toBe('a.""'); // Ends with dot - becomes 'a' + empty part
    expect(quoteIdentifier('.b')).toBe('"".b'); // Starts with dot - becomes empty part + 'b'
  });
});