import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedOnChainDiary = await deploy("OnChainDiary", {
    from: deployer,
    log: true,
  });

  console.log(`OnChainDiary contract: `, deployedOnChainDiary.address);
};

export default func;
func.id = "deploy_onChainDiary"; // id required to prevent reexecution
func.tags = ["OnChainDiary"];