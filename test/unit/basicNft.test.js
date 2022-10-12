const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNft", async function () {
          let basicNft
          let deployer

          beforeEach(async function () {
              // deploy FundMe contract using Hardhat-deploy
              // const accounts = await ethers.getSigners()
              // const account0 = accounts[0]

              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["basicnft"])
              basicNft = await ethers.getContract("BasicNft", deployer)
          })

          describe("constructor", async function () {
              it("Initializes  NFT correctly", async () => {
                  const response = await basicNft.getTokenCounter()
                  const symbol = await basicNft.symbol()
                  const name = await basicNft.name()

                  assert.equal(response.toString(), "0")
                  assert.equal(symbol, "DOG")
                  assert.equal(name, "Dogie")
              })
          })

          describe("Mint NFT", async function () {
              beforeEach(async () => {
                  const txResponse = await basicNft.mintNft()
                  await txResponse.wait(1)
              })

              it("Allows users to mint an NFT, and updates appropriately", async () => {
                  const tokenURI = await basicNft.tokenURI(0)
                  assert.equal(tokenURI, await basicNft.TOKEN_URI())
              })

              it("Show the correct balance and owner of an NFT", async () => {
                  await basicNft.mintNft()
                  const response = await basicNft.getTokenCounter()
                  assert.equal(response.toString(), "2")
              })
          })
      })
