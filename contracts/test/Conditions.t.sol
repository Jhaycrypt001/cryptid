// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TimeBoundReadCondition} from "../src/TimeBoundReadCondition.sol";
import {RevocableAllowlistReadCondition} from "../src/RevocableAllowlistReadCondition.sol";

/// Minimal cheatcode interface so we avoid a forge-std dependency.
interface Vm {
    function warp(uint256) external;
    function prank(address) external;
}

contract ConditionsTest {
    Vm constant vm = Vm(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);

    TimeBoundReadCondition timebound;
    RevocableAllowlistReadCondition allowlist;

    address owner = address(0xA11CE);
    address verifier = address(0xB0B);
    address stranger = address(0xCAFE);

    function setUp() public {
        timebound = new TimeBoundReadCondition();
        allowlist = new RevocableAllowlistReadCondition();
    }

    // ── TimeBoundReadCondition ───────────────────────────────────────────────
    function test_TimeBound_allowsVerifierInsideWindow() public {
        vm.warp(1000);
        bytes memory data = abi.encode(verifier, uint64(500), uint64(1500));
        require(timebound.checkReadCondition(verifier, data, ""), "in-window allow");
    }

    function test_TimeBound_deniesBeforeWindow() public {
        vm.warp(100);
        bytes memory data = abi.encode(verifier, uint64(500), uint64(1500));
        require(!timebound.checkReadCondition(verifier, data, ""), "before-window deny");
    }

    function test_TimeBound_deniesAfterExpiry() public {
        vm.warp(2000);
        bytes memory data = abi.encode(verifier, uint64(500), uint64(1500));
        require(!timebound.checkReadCondition(verifier, data, ""), "after-window deny");
    }

    function test_TimeBound_deniesWrongCaller() public {
        vm.warp(1000);
        bytes memory data = abi.encode(verifier, uint64(500), uint64(1500));
        require(!timebound.checkReadCondition(stranger, data, ""), "wrong-caller deny");
    }

    // ── RevocableAllowlistReadCondition ──────────────────────────────────────
    function test_Allowlist_grantThenRead() public {
        vm.prank(owner);
        allowlist.grant(verifier);
        bytes memory data = abi.encode(owner);
        require(allowlist.checkReadCondition(verifier, data, ""), "granted can read");
    }

    function test_Allowlist_strangerDenied() public {
        vm.prank(owner);
        allowlist.grant(verifier);
        bytes memory data = abi.encode(owner);
        require(!allowlist.checkReadCondition(stranger, data, ""), "stranger denied");
    }

    function test_Allowlist_revokeStopsRead() public {
        vm.prank(owner);
        allowlist.grant(verifier);
        vm.prank(owner);
        allowlist.revoke(verifier);
        bytes memory data = abi.encode(owner);
        require(!allowlist.checkReadCondition(verifier, data, ""), "revoked denied");
    }

    function test_Allowlist_isolatedPerOwner() public {
        // owner grants verifier; an unrelated owner's allowlist must be unaffected.
        vm.prank(owner);
        allowlist.grant(verifier);
        bytes memory otherOwnerData = abi.encode(stranger);
        require(
            !allowlist.checkReadCondition(verifier, otherOwnerData, ""),
            "per-owner isolation"
        );
    }
}
