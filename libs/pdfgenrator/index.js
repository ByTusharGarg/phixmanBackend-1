const path = require("path");
let pdf = require("html-pdf");
const ejs = require("ejs");
const fs = require("fs");


class Generatepdf {
    async generatePdfFile(obj,templateName, res) {
        const filename = Math.random() + ".pdf";

        try {
            ejs.renderFile(path.join(__dirname, '../mailer/template/', templateName), { data: obj }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        "header": {
                            "height": "20mm"
                        },
                        "footer": {
                            "height": "20mm",
                        },
                    };
                    pdf.create(data, options).toFile(`temp/${filename}`, function (err, data) {
                        if (err) {
                            res.send(err);
                        }
                        res.setHeader("Content-disposition", 'inline; filename="test.pdf"');
                        res.setHeader("Content-type", "application/pdf");
                        var fileData = fs.readFileSync(data.filename);
                        let interval = setTimeout(() => {
                            fs.unlink(data.filename, () => { });
                            clearInterval(interval);
                        }, 3000);

                        return res.send(fileData);
                    });
                }
            });
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .json({ message: "Error encountered while generating pdf." });
        }
    }
}

module.exports = new Generatepdf();