import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import axios from "axios";
import { parse } from "node-html-parser";
import timeout from "connect-timeout";
import cors from "cors";
var bodyParser = require('body-parser')

// import fs from "fs";

dotenv.config();
const app: Express = express();
// parse application/json
app.use(bodyParser.json())
app.use(cors())
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

const parseNumber = (val: string | undefined) => {
  if (!val) return NaN
  if (val.includes(',')) {
    const parsedString = val.replace(/,/g, '').replace('#', '')
    console.info('[Parse Number]', parsedString)
    return Number(parsedString)
  }
  return Number(val.replace('#', ''))
}

app.post("/scraper", async function (req: Request, res: Response) {
  console.log(req.body);
  //   const foundItem = list.find((item) => item.name === req.params.name);
  //   if (!foundItem)
  //     return res
  //       .status(200)
  //       .send({ status: "NO_ITEM", message: "No item found" });
  let hostname
  let language
  let url = new URL(req.body.url)

  if (req.body.url) {
    console.info('[1] URL detected:', url.href)
    hostname = url.hostname
    language = url.searchParams.get('language')
    console.info('[2] Detect provider:', hostname, ' language:', language)
  } else {
    return res.status(400).send({ error: "No URL provided" })
  }
  const result: any = { ranks: [], subRanks: [] };
  try {
    if (hostname) {
      result.name = req.body.name;
      if (hostname.includes('thomann')) {
        const { data } = await axios.get(url.href);
        const root = await parse(data);

        const productRank = root
          ?.querySelectorAll("span")
          ?.find((e) => e.rawAttrs === `class="meta-box__value"`)
          ?.childNodes[0].rawText.trim();
        const productCategory = root
          ?.querySelectorAll("div")
          ?.find((e) => e.rawAttrs === `class="meta-box__subtext"`)?.childNodes[0]?.rawText?.trim();
        const productName = root.querySelectorAll("h1")[0]?.childNodes[0].rawText;

        console.info('[3] Product detected:', productName, productRank, productCategory)
        result.productName = productName;
        result.ranks.push({
          rank: parseNumber(productRank),
          category: productCategory
        });
      } else if (hostname.includes('amazon')) {
        if (hostname.includes('amazon.de')) {
          if (!language || language !== 'en_GB') {
            url.searchParams.append('language', 'en_GB')
            console.info('[3] Attach language to URL:', url.searchParams.get('language'))
          }
        }
        const { data } = await axios.get(url.href);
        const root = await parse(data);

        const productName = root
          ?.querySelectorAll("span")
          ?.find((e) => e.rawAttrs === `id="productTitle" class="a-size-medium product-title-word-break product-title-resize"`)
          ?.childNodes[0].rawText.trim()
        console.info('[4] Detect Product name:', productName)

        let productRankText = root
          ?.querySelectorAll("ul")
          ?.filter((e) => e.rawAttrs === `class="a-unordered-list a-nostyle a-vertical a-spacing-none detail-bullet-list"`)[1]
          ?.childNodes[1]?.childNodes[0]?.childNodes[2]?.rawText

        console.info('[5] Detect product Rank info: ', productRankText)
        if (!productRankText) {
          console.info('[5.1] Product Rank info not found, maybe it is in different format. Try fetching for table view...')

          const node = root
            ?.querySelectorAll("table")
            ?.filter((e) => e.rawAttrs.includes(`id="productDetails_detailBullets_sections1"`)) // [0].childNodes.map(e => e.toString())
          // All table data is saved in node[0]?.childNodes[productRankNodeIndex]?.childNodes[3].childNodes[1]
          const tableNodeIndex = node[0]?.childNodes.findIndex(e => e.rawText.includes('Best Sellers Rank'))
          const allProductRanksNode = node[0]?.childNodes[tableNodeIndex]?.childNodes[3].childNodes[1]
          productRankText = allProductRanksNode.childNodes[1].rawText
          console.info('[5.2] New Product Rank Info for table view:', productRankText, allProductRanksNode.childNodes.map(e => e.toString()))
          try {
            console.info('[6] Try finding sub rank info for table view...')
            for (let i = 5; i < allProductRanksNode.childNodes.length; i += 4) {
              const subRankText = allProductRanksNode.childNodes[i].rawText
              console.info(`[6-${(i - 4) / 4}-1] found sub rank info:`, subRankText)
              const subRankInfo = subRankText.trim().split(' in ')
              const subRank = subRankInfo[0]
              const subCategory = subRankText.includes('(') ? subRankInfo[1].split('(')[0].trim() : subRankInfo[1]
              console.info(`[6-${(i - 4) / 4}-2] found sub rank info (rank-category):`, subRank, subCategory)
              result.subRanks.push({
                rank: parseNumber(subRank),
                category: subCategory
              })
            }
          } catch (err) {
            console.log(err)
          }
        } else {
          try {
            const subRanksNodes = root
              ?.querySelectorAll("ul")
              ?.filter((e) => e.rawAttrs === `class="a-unordered-list a-nostyle a-vertical zg_hrsr"`)[0].childNodes[1]?.childNodes?.filter(e => e)
            console.info('[6] Found node which includes subranks info:', subRanksNodes.map(e => e.rawText))


            for (const subrank of subRanksNodes) {
              console.info(`[6-${subRanksNodes.indexOf(subrank) + 1}] found sub rank info rawText:`, subrank.rawText)
              result.subRanks.push({
                rank: parseNumber(subrank?.childNodes[0]?.rawText?.trim().split(' ')[0]),
                category: subrank?.childNodes[1]?.rawText.split('(')[0]?.trim()
              })
            }

          } catch (err) {
            console.error('[6] Product rank error', err)
          }
        }

        const productRankInfo = productRankText.trim().split(' in ')

        const mainRank = productRankInfo[0]
        const mainCategory = productRankText.includes('(') ? productRankInfo[1].split('(')[0]?.trim() : productRankInfo[1]

        console.info('[7] Detect Product Rank info: ', productRankInfo, mainRank, mainCategory, productName)
        result.productName = productName
        result.ranks.push({
          rank: parseNumber(mainRank),
          category: mainCategory
        });
      }
    }

    // try {
    //   fs.appendFileSync(
    //     "./scraper.log",
    //     `${new Date()}: ${JSON.stringify(result)}\n`
    //   );
    // } catch (err) {}

    res.status(200).send({ data: result, statusMessage: "OK" });
  } catch (error: any) {
    // try {
    //   fs.appendFileSync(
    //     "./scraper.log",
    //     `${new Date()}: ${JSON.stringify(error)}\n`
    //   );
    // } catch (err) {}
    res.status(400).send({ error: error.toString() });
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
