const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", function () {
          let randomIpfsNft, deployer, vrfCoordinatorV2Mock

          beforeEach(async function () {
              //   accounts = await ethers.getSigners()
              //   deployer = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["mocks", "randomipfs"])
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              randomIpfsNft = await ethers.getContract("RandomipfsNft")
          })

          describe("constructor", async function () {
              it("sets starting values correctly", async function () {
                  const mintfee = "10000000000000000"
                  const tokenCounter = "0"
                  let tokenUris = [
                      "ipfs://QmYAeEtmSSK7dP4Lrtakmyt5sfaktV1dsXQqTjnWL1oqFS",
                      "ipfs://QmdfjeVDHWGkQcDMnaEPBsVXoEgagemxo4EBFvtWiaAbPM",
                      "ipfs://QmfABqDshMFoTpqRtBYBE77wEs9fVxdDxS5DFxKeXL2DRC",
                  ]
                  assert.equal("Random IPFS NFT", await randomIpfsNft.name())
                  assert.equal("RIN", await randomIpfsNft.symbol())
                  assert.equal(mintfee, await randomIpfsNft.getMintFee())
                  assert.equal(tokenCounter, await randomIpfsNft.getTokenCounter())
                  for (let i = 0; i < 3; i++) {
                      expect(tokenUris[i]).to.equal(await randomIpfsNft.getDogTokenUris(i))
                  }
              })
          })

          describe("requestNft", async function () {
              it("fails if payment isn't sent with the request", async function () {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomipfsNft_NeedMoreETHSent"
                  )
              })

              it("fails if payment is less than mintFee", async function () {
                  const fee = await randomIpfsNft.getMintFee()
                  await expect(
                      randomIpfsNft.requestNft({ value: fee.sub(ethers.utils.parseEther("0.001")) })
                  ).to.be.revertedWith("RandomipfsNft_NeedMoreETHSent")
              })

              it("emits event NftRequested and requests random words", async function () {
                  const fee = await randomIpfsNft.getMintFee()
                  await expect(randomIpfsNft.requestNft({ value: fee.toString() })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", () => {
              it("mints NFT after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI("0")
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await randomIpfsNft.getMintFee()
                          const requestNftResponse = await randomIpfsNft.requestNft({
                              value: fee.toString(),
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          describe("getBreedFromModdedRng", () => {
              it("check chances array", async function () {
                  const testArray = [10, 40, 100]
                  const finalArray = await randomIpfsNft.getChanceArray()

                  for (let i = 0; i < 3; i++) {
                      assert.equal(finalArray[i], testArray[i])
                  }
              })
              it("should return pug if moddedRng < 10", async function () {
                  const breed = await randomIpfsNft.getBreedFromModdedRng(9)
                  assert.equal(0, breed)
              })

              it("should return shiba-inu if moddedRng is between 10 - 39", async function () {
                  const breed = await randomIpfsNft.getBreedFromModdedRng(10)
                  assert.equal(1, breed)
              })
              it("should return st. bernard if moddedRng is between 40 - 99", async function () {
                  const breed = await randomIpfsNft.getBreedFromModdedRng(50)
                  assert.equal(2, breed)
              })
              it("should revert if moddedRng > 99", async function () {
                  await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.revertedWith(
                      "RandomipfsNft_RangeOutOfBounds"
                  )
              })
          })
      })
