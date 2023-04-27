import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import axios from "axios";
import { NodeType, parse } from "node-html-parser";
import timeout from "connect-timeout";
var bodyParser = require('body-parser')

// import fs from "fs";

dotenv.config();
const app: Express = express();
// parse application/json
app.use(bodyParser.json())
app.use(timeout(7000));

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
  let hostname = ''
  if (req.body.url) {
    const url = new URL(req.body.url)
    hostname = url.hostname
    console.log('detect provider:', hostname)
  }
  const result: any = { ranks: [], subRanks: [] };
  try {
    const { data } = await axios.get(req.body.url);
    const root = await parse(data);
    // console.log('web data', root)

    if (hostname) {
      result.name = req.body.name;
      if (hostname.includes('thomann')) {
        const productRank = root
          ?.querySelectorAll("span")
          ?.find((e) => e.rawAttrs === `class="meta-box__value"`)
          ?.childNodes[0].rawText.trim();
        const productCategory = root
          ?.querySelectorAll("div")
          ?.find((e) => e.rawAttrs === `class="meta-box__subtext"`)?.childNodes[0]?.rawText?.trim();
        const productName = root.querySelectorAll("h1")[0]?.childNodes[0].rawText;

        console.log(productName, productRank, productCategory);
        result.productName = productName;
        result.ranks.push({
          rank: productRank,
          category: productCategory
        });
      } else if (hostname.includes('amazon')) {
        console.log('run amazon...')
        const productName = root
          ?.querySelectorAll("span")
          ?.find((e) => e.rawAttrs === `id="productTitle" class="a-size-medium product-title-word-break product-title-resize"`)
          ?.childNodes[0].rawText.trim()

        const productRankText = root
          ?.querySelectorAll("ul")
          ?.filter((e) => e.rawAttrs === `class="a-unordered-list a-nostyle a-vertical a-spacing-none detail-bullet-list"`)[1]
          ?.childNodes[1]?.childNodes[0]?.childNodes[2]?.rawText.trim().split(' ')

        const subRanksNodes = root
          ?.querySelectorAll("ul")
          ?.filter((e) => e.rawAttrs === `class="a-unordered-list a-nostyle a-vertical zg_hrsr"`)[0].childNodes[1]?.childNodes?.filter(e => e)

        for (const subrank of subRanksNodes) {
          result.subRanks.push({
            rank: subrank?.childNodes[0]?.rawText?.trim().split(' ')[0],
            category: subrank?.childNodes[1]?.rawText
          })
        }

        const mainRank = productRankText[0]
        const mainCategory = productRankText.filter((_e, i) => i > 1 && i < productRankText.length - 1).join(' ')

        console.log('productRankText', productRankText, mainRank, mainCategory, productName)
        result.productName = productName
        result.ranks.push({
          rank: mainRank,
          category: mainCategory
        });

        // console.log('productRankText', productRankText.toString())
        // // console.log('productRankText', productRankText.childNodes)
        // // console.log('productRankText', Object.keys(productRankText))
        // // console.log('productRankText', productRankText.childNodes[0])

      }
    }

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
