// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IReadCondition} from "./IReadCondition.sol";

/// @title RevocableAllowlistReadCondition
/// @notice The revocation "money shot". A claim owner maintains an allowlist of
///         verifiers that may read their claims. Granting/revoking is a normal
///         transaction the owner sends to THIS contract — it takes effect for
///         every vault that points its read condition here.
///
/// conditionData (stored at vault allocation) = abi.encode(address claimOwner)
///   The vault records whose allowlist governs it. At read time the precompile
///   calls checkReadCondition(verifier, conditionData, ...) and we return
///   whether `claimOwner` currently allows `verifier`.
///
/// Flow:
///   owner.grant(verifier)   -> verifier can decrypt all of owner's vaults gated here
///   owner.revoke(verifier)  -> future reads by verifier revert; access is gone
contract RevocableAllowlistReadCondition is IReadCondition {
    /// @dev claimOwner => verifier => allowed.
    mapping(address => mapping(address => bool)) public allowed;

    event AccessGranted(address indexed owner, address indexed verifier);
    event AccessRevoked(address indexed owner, address indexed verifier);

    /// @notice Grant `verifier` read access to the caller's gated claims.
    function grant(address verifier) external {
        allowed[msg.sender][verifier] = true;
        emit AccessGranted(msg.sender, verifier);
    }

    /// @notice Grant several verifiers at once.
    function grantMany(address[] calldata verifiers) external {
        for (uint256 i; i < verifiers.length; ++i) {
            allowed[msg.sender][verifiers[i]] = true;
            emit AccessGranted(msg.sender, verifiers[i]);
        }
    }

    /// @notice Revoke `verifier`'s read access. Future reads revert immediately.
    function revoke(address verifier) external {
        allowed[msg.sender][verifier] = false;
        emit AccessRevoked(msg.sender, verifier);
    }

    /// @inheritdoc IReadCondition
    function checkReadCondition(
        address caller,
        bytes calldata conditionData,
        bytes calldata /* accessAuxData */
    ) external view returns (bool) {
        address claimOwner = abi.decode(conditionData, (address));
        return allowed[claimOwner][caller];
    }

    /// @notice Convenience encoder for the off-chain SDK and tests.
    function encode(address claimOwner) external pure returns (bytes memory) {
        return abi.encode(claimOwner);
    }
}
