// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CDR read-condition interface.
/// @notice The exact shape the CDR precompile (and the SDK preflight) calls to
///         decide whether a read request may proceed. `caller` is the address
///         that submitted the read transaction (the verifier). `conditionData`
///         is the per-vault data stored at allocation time. `accessAuxData` is
///         supplied by the caller at read time.
interface IReadCondition {
    function checkReadCondition(
        address caller,
        bytes calldata conditionData,
        bytes calldata accessAuxData
    ) external view returns (bool);
}
