require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: [
    "http://localhost",
    "http://127.0.0.1",
    "https://forallcases.com",
    "https://foalca.com"
  ]
}));
app.use(express.json());

const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;
if (!operatorPrivateKey) throw new Error("❌ not found OPERATOR_PRIVATE_KEY in .env!");

const wallet = new ethers.Wallet(operatorPrivateKey);

app.post("/sign", async (req, res) => {
  const { address, amount } = req.body;

  if (!ethers.isAddress(address)) return res.status(400).json({ error: "Invalid address" });
  if (!amount || isNaN(amount)) return res.status(400).json({ error: "Invalid amount" });

  try {
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    const nonce = Date.now();

    const rawMessageHash = ethers.keccak256(
      ethers.solidityPacked(["address", "uint256", "uint256"], [address, amountWei, nonce])
    );

    const signature = await wallet.signMessage(ethers.getBytes(rawMessageHash));

    return res.json({ signature, nonce });
  } catch (err) {
    console.error("Signing error:", err);
    res.status(500).json({ error: "Signing failed" });
  }
});

app.listen(port, () => {
  console.log(`✅ Claim-signing server listening at http://localhost:${port}`);
});
