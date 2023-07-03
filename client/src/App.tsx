import React, { useState } from 'react'
import './App.css';
import axios from 'axios'
import Container from '@mui/material/Container/Container';
import TextField from '@mui/material/TextField/TextField';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import Button from '@mui/material/Button';

// eslint-disable-next-line
export default () => {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')

  const [data, setData]: [any[], any] = useState([])

  const getData = async () => {
    const result = await axios.post('http://localhost:4000/api/scraper', {
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
      <br />
      <Grid2 container spacing={2}>
        <Grid2 xs={4}>
          <h4>Product's URL</h4>
        </Grid2>
        <Grid2 xs={8}>
          <TextField id="outlined-basic" variant="outlined" value={url} onChange={(e: any) => setUrl(e.target.value)} />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={2}>
        <Grid2 xs={4}>
          <h4>Product's Custom Name</h4>
        </Grid2>
        <Grid2 xs={8}>
          <TextField id="outlined-basic" variant="outlined" value={name} onChange={(e: any) => setName(e.target.value)} />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={2}>
        <Grid2 xs={4} />
        <Grid2 xs={8}>
          <Button variant="contained" onClick={getData} size="large" >Send</Button>
        </Grid2>
      </Grid2>


      <hr />
      {data && data.map((d, i) => (
        <div key={i} style={{ paddingBottom: '2rem' }}>

          <Grid2 container spacing={2}>
            <Grid2 xs={1}>
              <h4>{i + 1}</h4>
            </Grid2>
            <Grid2 xs={3}>
              <h4>Product: </h4>
            </Grid2>
            <Grid2 xs={8}>
              <p>{d.name} ({d.productName})</p>
            </Grid2>
          </Grid2>
          <Grid2 container spacing={2}>
            <Grid2 xs={1} />
            <Grid2 xs={3}>
              <h4>Rank: </h4>
            </Grid2>
            <Grid2 xs={8}>
              {d.ranks?.map((rank: any, i: number) => (
                <p key={`main-rank-${i}`}>- {rank.rank} in {rank.category}</p>
              ))}
              {d.subRanks && d.subRanks.length > 0 && <><p>Also</p>

                {d.subRanks?.map((rank: any, i: number) => (
                  <p key={`rank-${i}`}>- {rank.rank} in {rank.category}</p>
                ))}
              </>}
            </Grid2>
          </Grid2>
        </div>
      ))}
    </Container>
  )
}
