pragma solidity ^0.6.10;

library GigStatuses {
    enum GigStatus {Open, Taken, Submitted, Completed}

    function isTransitionAllowed(GigStatus _from, GigStatus _to) public pure returns (bool) {
        if (_from == GigStatus.Completed || _to == GigStatus.Open) {
            return false;
        }

        return ((uint8(_from) + 1) == uint8(_to)); 
    }
}