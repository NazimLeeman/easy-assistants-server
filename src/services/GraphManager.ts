import { StateGraph, END } from '@langchain/langgraph';
import { TaskState } from '../models/TaskState';
import { Graph } from '../models/Graph';
import { getPlanNode, getAgentNode, getRouteEdge, getSolveNode } from './WorkflowHandler';
import { Runnable } from 'langchain/runnables';

export class GraphManager {
  planNode: (state: TaskState) => Promise<{ steps: Array<[string, string, string, string]>; plan_string: string }>;
  agents: { [key: string]: { agent: Runnable, agentPrompt: string, toolFunction: Function } };
  solveNode: (state: TaskState) => Promise<{ result: string }>;
  graph: Graph<any, any>;

  constructor(
    planModel: Runnable,
    agents: { [key: string]: { agent: Runnable, agentPrompt: string, toolFunction: Function } },
    solveModel: Runnable,
    outputHandler: Function,
  ) {
    this.planNode = getPlanNode(planModel, outputHandler);
    this.agents = agents;
    this.solveNode = getSolveNode(solveModel, outputHandler);
    this.graph = this._constructGraph();
  }

  _constructGraph(): Graph<any, any> {
    const graph = new StateGraph<TaskState>({
      channels: {
        task: { value: null },
        plan_string: { value: null },
        steps: { value: (x, y) => x.concat(y), default: () => [] },
        results: { value: null },
        result: { value: null },
      },
    });

    graph.addNode('plan', this.planNode);
    graph.addNode('solve', this.solveNode);
    graph.addConditionalEdges('plan', getRouteEdge());
    graph.addEdge('solve', END);

    for (const [name, { agent, agentPrompt, toolFunction}] of Object.entries(this.agents)) {
      const agentNode = getAgentNode(agent, agentPrompt, toolFunction);  
      graph.addNode(name, agentNode);
      graph.addConditionalEdges(name, getRouteEdge());
    }

    graph.setEntryPoint('plan');
    return graph.compile();
  }

  getApp(): any {
    return this.graph;
  }
}
