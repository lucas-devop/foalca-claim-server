require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
const port = 4000;

app.use(cors({
  origin: ["http://localhost", "http://127.0.0.1", "http://localhost/foalca.io"]
}));
app.use(express.json());

const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;
if (!operatorPrivateKey) throw new Error("❌ OPERATOR_PRIVATE_KEY missing in .env");

const wallet = new ethers.Wallet(operatorPrivateKey);

// Simple in-memory nonce tracking per user (for demo purposes)
const userNonces = new Map();

app.post("/sign", async (req, res) => {
  const { address, amount } = req.body;

  if (!ethers.isAddress(address)) return res.status(400).json({ error: "Invalid address" });
  if (!amount || isNaN(amount)) return res.status(400).json({ error: "Invalid amount" });

  try {
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    const lastNonce = userNonces.get(address.toLowerCase()) || 0;
    const nonce = lastNonce + 1;
    const expiry = Math.floor(Date.now() / 1000) + 120; // 2 min expiry window

    userNonces.set(address.toLowerCase(), nonce);

    const messageHash = ethers.keccak256(
      ethers.solidityPacked(["address", "uint256", "uint256", "uint256"], [address, amountWei, nonce, expiry])
    );

    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    return res.json({ signature, nonce, expiry });
  } catch (err) {
    console.error("Signing error:", err);
    res.status(500).json({ error: "Signing failed" });
  }
});

app.listen(port, () => {
  console.log(`✅ Secure claim-signing server listening at http://localhost:${port}`);
});