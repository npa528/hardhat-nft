const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()

    // Basic NFT
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const basicNftMintTx = await basicNft.mintNft()
    await basicNftMintTx.wait(1)
    console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)} `)

    // Random NFT
    const randomipfsNft = await ethers.getContract("RandomipfsNft", deployer)
    const mintFee = await randomipfsNft.getMintFee()

    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 300000) // 5 minutes
        randomipfsNft.once("NftMinted", async () => {
            resolve()
        })

        const randomipfsNftMintTx = await randomipfsNft.requestNft({ value: mintFee.toString() })
        const randomIpfsNftMintTxReceipt = await randomipfsNftMintTx.wait(1)

        if (developmentChains.includes(network.name)) {
            const requestId = randomIpfsNftMintTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomipfsNft.address)
        }
    })
    console.log(`Random IPFS NFT index 0 tokenURI: ${await randomipfsNft.tokenURI(0)}`)

    // Dynamic SVG NFT
    const highValue = ethers.utils.parseEther("4000")
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue.toString())
    await dynamicSvgNftMintTx.wait(1)
    console.log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`)
}

module.exports.tags = ["all", "mint"]
