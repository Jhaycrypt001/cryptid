// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TimeBoundReadCondition} from "../src/TimeBoundReadCondition.sol";
import {RevocableAllowlistReadCondition} from "../src/RevocableAllowlistReadCondition.sol";

/// Minimal broadcast cheatcode interface (no forge-std dependency).
interface Vm {
    function startBroadcast() external;
    function stopBroadcast() external;
}

/// Deploy both custom read conditions to Aeneid.
///
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url https://aeneid.storyrpc.io \
///     --private-key $WALLET_PRIVATE_KEY --broadcast
contract Deploy {
    Vm constant vm = Vm(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);

    function run() external returns (address timebound, address allowlist) {
        vm.startBroadcast();
        timebound = address(new TimeBoundReadCondition());
        allowlist = address(new RevocableAllowlistReadCondition());
        vm.stopBroadcast();
    }
}
