# pg-ninja-excel
Node.js lightweight asynchronous library for export PostgreSQL queries (SELECT) to Excel

# **navigation**

- [installation](#installation)
- **usage**
    - [import](#import)
    - [constructor](#constructor)
    - [create file name](#create_file_name)
    - [convert to Excel](#pg_to_excel)
- [example](#example)
- [summary](#summary)

## installation

---

```
$ npm i pg-ninja-excel
```

## usage

---

additional library for `pg-ninja` that add option convert result of SELECT query into Excel file.

### **Import**

```
import excel from 'pg-ninja-excel'

const converter = new excel();
```

### **constructor**

```
new converter(max_width: int, wrap_words: boolean)
```

`max-width` defines width of column (auto-fit columns by width from 11 to your width). default value - `50`.

`wrap-words` defines words wrapping. default value - `true`. in case of big responce values better would be stay with `false`.

---

### **create_file_name**

generate file name for your PostgreSQL report

syntax:

```
converter.create_file_name(): string
```

returns string of new file name in format: `postgresql-report-{DATE}T{TIME}-{XXXXX}.xlsx`, for example - postgresql-report-11-27-2024T8_19_56AM-3qcj6.xlsx

---

### **pg_to_excel**

creates Excel file from your object of PostgreSQL responce.

syntax:

```
converter.pg_to_excel(rows, path='./'): Promise<string/object>
```

result:
```
resolve - path to file with file name (string)
reject - error
```

in case of you want to create Excel depends on something different, but not PostgreSQL responce, template of rows:
```
[
    {key: value, ..., key:value},
    ...
    {key: value, ..., key:value}
]
```

and also you can specify path. default path `./` means file will be near to your script. change directory, for example `./report/` and if you want to create your own file you can write name by yourself, for example `./report/test1.xlsx`.
**otherwise always use `/` in end of your path!**

** ! do not `return` reject-available function ! **

# Example

with using `pg-ninja` (install `pg-ninja` with `$ npm install pg-ninja`)

```
import pg from 'pg-ninja';
import excel from 'pg-ninja-excel';

const database = new pg({
    connectionString: process.env.PG_CONNECTION
});
const converter = new excel();

database.query('SELECT * FROM customers;').then(res => {
    excel.pg_to_excel(res?.rows).then(res => {
        console.log('Excel report was created in this path and file name: ', res);
    }, err => {
        console.log('Excel error: ', err);
    });
}, err => {
    console.log('PostgreSQL error: ', err);
});
```

# Summary

in benefits of this variant it sets auto filters, adding borders to columns, pin the first row (so you always remember what you see), setting width of columns and same to word wrapping.
