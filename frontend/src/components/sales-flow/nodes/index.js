import RootNode from './RootNode';
import SellerActionNode from './SellerActionNode';
import CustomerResponseNode from './CustomerResponseNode';
import DecisionNode from './DecisionNode';
import OutcomeNode from './OutcomeNode';

export const nodeTypes = {
  root: RootNode,
  sellerAction: SellerActionNode,
  customerResponse: CustomerResponseNode,
  decision: DecisionNode,
  outcome: OutcomeNode,
};

export {
  RootNode,
  SellerActionNode,
  CustomerResponseNode,
  DecisionNode,
  OutcomeNode,
};
