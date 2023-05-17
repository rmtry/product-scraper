import React, { useState } from 'react'
import './App.css';
import axios from 'axios'
import Container from '@mui/material/Container/Container';
import Box from '@mui/material/Box/Box';
import TextField from '@mui/material/TextField/TextField';

export default () => {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')

  const [data, setData]: [any[], any] = useState([])

  const getData = async () => {
    const result = await axios.post('http://localhost:4000/scraper', {
      url,
      name
    })
    console.log(result)
    if (result.data) {
      const clonedData = [...data]
      clonedData.push(result.data.data)
      setData(clonedData)
    }
    setUrl('')
    setName('')
  }

  console.log('data:', data)

  return (
    <Container className="App" >
      <Box>
        <TextField id="outlined-basic" label="URL" variant="outlined" value={url} onChange={(e: any) => setUrl(e.target.value)} />
        <br />
        <TextField id="outlined-basic" label="Name" variant="outlined" value={name} onChange={(e: any) => setName(e.target.value)} />
        <button onClick={getData}>Send</button>
      </Box>


      <hr />
      {data.map((d, i) => (
        <div key={i} style={{ paddingBottom: '2rem' }}>
          <h4>Product: <span>{d.productName} </span></h4>
          <h4>Rank: </h4>
          <ul>
            {d.ranks?.map((rank: any, i: number) => (
              <li key={`rank-${i}`}>{rank.rank} - {rank.category}</li>
            ))}
          </ul>
          {d.subRanks && <><p>Also</p>
            <ul>
              {d.subRanks?.map((rank: any, i: number) => (
                <li key={`rank-${i}`}>{rank.rank} - {rank.category}</li>
              ))}
            </ul></>}
        </div>
      ))}
    </Container>
  )
}
