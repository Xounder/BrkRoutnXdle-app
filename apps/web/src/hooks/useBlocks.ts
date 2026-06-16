import { useBlockContext } from "../contexts/BlockContext";

export function useBlocks() {
  return useBlockContext();
}
