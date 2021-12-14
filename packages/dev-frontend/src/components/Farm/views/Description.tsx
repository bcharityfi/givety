import React from "react";
import { Text } from "theme-ui";
import { useGivety } from "../../../hooks/GivetyContext";
import { LP } from "../../../strings";
import { Transaction } from "../../Transaction";
import { Decimal } from "givety-lib-base";
import { ActionDescription } from "../../ActionDescription";
import { useValidationState } from "../context/useValidationState";

type DescriptionProps = {
  amount: Decimal;
};

const transactionId = "farm-stake";

export const Description: React.FC<DescriptionProps> = ({ amount }) => {
  const {
    givety: { send: givety }
  } = useGivety();
  const { isValid, hasApproved, isWithdrawing, amountChanged } = useValidationState(amount);

  if (!hasApproved) {
    return (
      <ActionDescription>
        <Text>To stake your {LP} tokens you need to allow Givety to stake them for you</Text>
      </ActionDescription>
    );
  }

  if (!isValid || amountChanged.isZero) {
    return null;
  }

  return (
    <ActionDescription>
      {isWithdrawing && (
        <Transaction id={transactionId} send={givety.unstakeGivTokens.bind(givety, amountChanged)}>
          <Text>
            You are unstaking {amountChanged.prettify(4)} {LP}
          </Text>
        </Transaction>
      )}
      {!isWithdrawing && (
        <Transaction id={transactionId} send={givety.stakeGivTokens.bind(givety, amountChanged)}>
          <Text>
            You are staking {amountChanged.prettify(4)} {LP}
          </Text>
        </Transaction>
      )}
    </ActionDescription>
  );
};
