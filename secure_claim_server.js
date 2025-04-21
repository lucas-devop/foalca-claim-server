require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 4000;

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1363779241942188052/tfs6lEe_RLMuWM4gfMQmN1uPbAvnJRWawr3TFIT1QPQy4oa_8eqS1VDyZEzcg4ps-csC";

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
console.log("🔐 Backend is signing as address:", wallet.address);

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

    await axios.post(DISCORD_WEBHOOK_URL, {
      embeds: [
        {
          title: `\u2728 Someone just claimed`,
          description: `Claim has been signed and tokens sent to the wallet!`,
          color: 0x1abc9c,
          fields: [
            { name: "Address", value: address, inline: true },
            { name: "Amount", value: `${amount} FOALCA`, inline: true },
            { name: "Nonce", value: nonce.toString(), inline: false }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    });

    return res.json({ signature, nonce });
  } catch (err) {
    console.error("Signing error:", err);
    res.status(500).json({ error: "Signing failed" });
  }
});

app.listen(port, () => {
  console.log(`\u2705 Claim-signing server listening at http://localhost:${port}`);
});
