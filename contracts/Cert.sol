// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title Functions contract used for Automation.
 * @notice This contract is a demonstration of using Functions and Automation.
 * @notice You may need to add a Forwarder for additional security.
 * @notice NOT FOR PRODUCTION USE
 */
contract CertOracle is FunctionsClient, ConfirmedOwner {
    address public upkeepContract;
    bytes public googleRequest;
    uint64 public subscriptionId;
    uint32 public gasLimit;
    bytes32 public donID;
    bytes32 public google_lastRequestId;
    bytes public google_lastResponse;
    bytes public google_lastError;

    error NotAllowedCaller(
        address caller,
        address owner,
        address automationRegistry
    );
    error UnexpectedRequestID(bytes32 requestId);

    event Response(bytes32 indexed requestId, bytes response, bytes err);

    constructor(
        address router
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {}

    /**
     * @notice Reverts if called by anyone other than the contract owner or automation registry.
     */
    modifier onlyAllowed() {
        if (msg.sender != owner() && msg.sender != upkeepContract)
            revert NotAllowedCaller(msg.sender, owner(), upkeepContract);
        _;
    }

    function setAutomationCronContract(
        address _upkeepContract
    ) external onlyOwner {
        upkeepContract = _upkeepContract;
    }

    /// @notice Update the Google Cert request settings
    /// @dev Only callable by the owner of the contract
    /// @param _request The new encoded request to be set. The request is encoded offchain
    /// @param _subscriptionId The new subscription ID to be set
    /// @param _gasLimit The new gas limit to be set
    /// @param _donID The new job ID to be set
    function updateGoogleRequest(
        bytes memory _request,
        uint64 _subscriptionId,
        uint32 _gasLimit,
        bytes32 _donID
    ) external onlyOwner {
        googleRequest = _request;
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
        donID = _donID;
    }

    /**
     * @notice Send a pre-encoded Google request
     * @return requestId The ID of the sent request
     */
    function sendGoogleRequest()
        external
        onlyAllowed
        returns (bytes32 requestId)
    {
        google_lastRequestId = _sendRequest(
            googleRequest,
            subscriptionId,
            gasLimit,
            donID
        );
        return google_lastRequestId;
    }

    /**
     * @notice Store latest result/error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (google_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        google_lastResponse = response;
        google_lastError = err;
        emit Response(requestId, google_lastResponse, google_lastError);
    }
}
