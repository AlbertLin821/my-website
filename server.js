const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// 靜態資源
app.use(express.static('public'));

// 自動導向 /html/quiz_merge.html 為首頁
app.get('/', (req, res) => {
  res.redirect('/html/quiz_merge.html');
});

app.listen(port, () => {
  console.log(`伺服器運行中：http://localhost:${port}`);
});
