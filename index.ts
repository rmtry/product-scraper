import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import axios from "axios";
import { parse } from "node-html-parser";
var bodyParser = require('body-parser')

// import fs from "fs";

dotenv.config();
const app: Express = express();
// parse application/json
app.use(bodyParser.json())
const port = process.env.PORT;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

/*
 * expect 
    {
        id?: string
        url: string
        name: string
    }
*/
app.post("/scraper", async function (req: Request, res: Response) {
  console.log(req.body);
  //   const foundItem = list.find((item) => item.name === req.params.name);
  //   if (!foundItem)
  //     return res
  //       .status(200)
  //       .send({ status: "NO_ITEM", message: "No item found" });
  const result: any = {};
  try {
    const { data } = await axios.get(req.body.url);
    // console.log('web data', data)
    const root = await parse(data);

    const productRank = root
      ?.querySelectorAll("span")
      ?.find((e) => e.rawAttrs === `class="meta-box__value"`)
      ?.childNodes[0].rawText.trim();
    const productName = root.querySelectorAll("h1")[0]?.childNodes[0].rawText;

    console.log(productName, productRank);
    result.name = req.body.name;
    result.productName = productName;
    result.rank = productRank;
    // try {
    //   fs.appendFileSync(
    //     "./scraper.log",
    //     `${new Date()}: ${JSON.stringify(result)}\n`
    //   );
    // } catch (err) {}

    res.status(200).send({ data: result, statusMessage: "OK" });
  } catch (error) {
    // try {
    //   fs.appendFileSync(
    //     "./scraper.log",
    //     `${new Date()}: ${JSON.stringify(error)}\n`
    //   );
    // } catch (err) {}
    res.status(404).send({ error });
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
