import excel from "exceljs";

export default class e {
  constructor(max_width = 50, wrap_words = true) {
    this.max_width = 50;
    this.wrap_words = true;
  }

  create_file_name() {
    let name = "postgresql-report";
    let date_stamp = new Date()
      .toLocaleString()
      .replaceAll(".", "-")
      .replaceAll("/", "-")
      .replace(", ", "T")
      .replace(" ", "");
    let spit = (Math.random() + 1).toString(36).substring(7);
    let extention = ".xlsx";
    return [name, date_stamp, spit].join("-") + extention;
  }

  async pg_to_excel(rows, path = "./") {
    return new Promise((resolve, reject) => {
      const workbook = new excel.Workbook();

      workbook.creator = "pg-ninja-excel.js";
      workbook.lastModifiedBy = "pg-ninja-excel.js";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.lastPrinted = new Date();

      const sheet = workbook.addWorksheet("PostgreSQL Result");
      const worksheet = workbook.getWorksheet("PostgreSQL Result");

      let header = [];
      let header_length = 0;
      for (let key in rows[0]) {
        header_length++;
        header.push({ header: key, key: key });
      }

      worksheet.columns = header;
      worksheet.views = [{ state: "frozen", xSplit: header_length, ySplit: 1 }];

      worksheet.addRows(rows);

      worksheet.autoFilter = {
        from: {
          row: 1,
          column: 1,
        },
        to: {
          row: 1,
          column: header_length,
        },
      };

      for (let i = 1; i <= header_length; i++) {
        worksheet.getColumn(i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        if (this.wrap_words) {
          worksheet.getColumn(i).alignment = { wrapText: true };
        }
      }

      worksheet.columns.forEach((column) => {
        let width = 8;

        column["eachCell"]((cell) => {
          let current_width = cell.value ? cell.value.toString().length : 8;
          if (current_width > width) {
            width = current_width;
          }
        });

        column.width = Math.min(this.max_width, width + 3);
      });

      if (path.at(-1) == "/") path += this.create_file_name();
      workbook.xlsx.writeFile(path).then(
        (res) => {
          resolve(path);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }
}
