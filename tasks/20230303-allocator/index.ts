import { Task, TaskRunOptions } from '../../hardhat'
import { DeploymentInputs } from './input'

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as DeploymentInputs
  const args = []
  // TODO: Update contract name
  await task.deployAndVerify('BananaAllocator', args, from, force)
}
