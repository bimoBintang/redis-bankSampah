import redis from 'redis';
import express from 'express';
import fetch from 'node-fetch';

const UserClient = 'username';
const Port = 4500;
const RedisPort = 6379;

const user = redis.createClient({
    url: `redis://localhost:${RedisPort}`
});

user.on('error', function (err) {
    console.log('Redis Client Error', err);
}); 

await user.connect();

const app = express();
app.use(express.json());

function Format( name, alamat, saldo) {
    user.set('name', name, 'alamat', alamat, 'saldo', saldo, (err, reply) => {
        if (err) {
            console.log(err);
        }
    });
    return null;
}
Format('John Doe', 'Jl. Kebersihan No. 1', 100000);

user.hmset(`anggota:${memberId}`, updatedData, function(err, reply) {
    if (err) {
      console.error(err);
    } else {
      console.log(`Data anggota dengan ID ${memberId} telah diupdate.`);
    }
  });

  // Menghapus data anggota
user.del(`anggota:${memberId}`, function(err, reply) {
    if (err) {
      console.error(err);
    } else {
      console.log(`Data anggota dengan ID ${memberId} telah dihapus.`);
    }
  });

async function GetResponse(req, res) {
    try {
        const { id } = req.params;
        const Response = await fetch(`http://localhost:${RedisPort}/nasabah/${id}`);
        const resault = await Response.json();

        await user.set(id, JSON.stringify(resault));
        res.send(resault);
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
}

function addTransaksi(nasabahId, tanggal, jenis, berat) {
    user.lPush(`transaksi:${nasabahId}`, `${tanggal}|${jenis}|${berat}`, (err, reply) => {
        if (err) console.error(err);
        else console.log(reply);
    });
}

function getTransaksi(req, res) {
    const { nasabahId } = req.params;
    user.lrange(`transaksi:${nasabahId}`, 0, -1, (err, reply) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(reply);
        }
    });
}

function addJenisSampah(jenis) {
    user.SADD('jenis_sampah', jenis, (err, reply) => {
        if (err) console.error(err);
        else console.log(reply);
    });
}

function getJenisSampah(req, res) {
    user.smembers('jenis_sampah', (err, reply) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(reply);
        }
    });
}

function setSaldo(nasabahId, saldo) {
    user.set(`saldo:${nasabahId}`, saldo, (err, reply) => {
        if (err) console.error(err);
        else console.log(reply);
    });
}

function getSaldo(req, res) {
    const { nasabahId } = req.params;
    user.get(`saldo:${nasabahId}`, (err, reply) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(reply);
        }
    });
}

// Routes
app.post('/nasabah', (req, res) => {
    const { id, name, alamat, phone } = req.body;
    Format(id, name, alamat, phone);
    res.send('Nasabah added');
});

app.get('/nasabah/:id', GetResponse);

app.post('/transaksi', (req, res) => {
    const { nasabahId, tanggal, jenis, berat } = req.body;
    addTransaksi(nasabahId, tanggal, jenis, berat);
    res.send('Transaksi added');
});

app.get('/transaksi/:nasabahId', getTransaksi);

app.post('/jenis-sampah', (req, res) => {
    const { jenis } = req.body;
    addJenisSampah(jenis);
    res.send('Jenis Sampah added');
});

app.get('/jenis-sampah', getJenisSampah);

app.post('/saldo', (req, res) => {
    const { nasabahId, saldo } = req.body;
    setSaldo(nasabahId, saldo);
    res.send('Saldo set');
});

app.get('/saldo/:nasabahId', getSaldo);

app.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
});



addTransaksi(1001, '2024-07-01', 'plastik', '2kg');
addJenisSampah('plastik');
addJenisSampah('kertas');
setSaldo(1001, 50000);
