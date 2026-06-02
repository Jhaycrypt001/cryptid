// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IReadCondition} from "./IReadCondition.sol";

/// @title TimeBoundReadCondition
/// @notice Grants a specific verifier read access only within a time window.
///         Stateless and pure — no storage, no owner calls. This makes it the
///         lowest-risk custom condition to verify against the Aeneid precompile:
///         if the precompile invokes user-deployed read conditions at all, this
///         one will work without any extra setup.
///
/// conditionData (stored at vault allocation) = abi.encode(
///     address verifier,   // the only address allowed to read
///     uint64  notBefore,  // unix seconds; access opens at this time
///     uint64  notAfter    // unix seconds; access expires after this time
/// )
contract TimeBoundReadCondition is IReadCondition {
    /// @inheritdoc IReadCondition
    function checkReadCondition(
        address caller,
        bytes calldata conditionData,
        bytes calldata /* accessAuxData */
    ) external view returns (bool) {
        (address verifier, uint64 notBefore, uint64 notAfter) =
            abi.decode(conditionData, (address, uint64, uint64));

        return
            caller == verifier &&
            block.timestamp >= notBefore &&
            block.timestamp <= notAfter;
    }

    /// @notice Convenience encoder so the off-chain SDK and tests agree on layout.
    function encode(address verifier, uint64 notBefore, uint64 notAfter)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(verifier, notBefore, notAfter);
    }
}
