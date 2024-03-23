import { Prisma, $Enums } from "@blobscan/db";
import type {
  BlobDataStorageReference,
  Blob as DBBlob,
  Block as DBBlock,
  Transaction as DBTransaction,
} from "@blobscan/db";
import { z } from "@blobscan/zod";

import { t } from "../trpc-client";
import {
  dataStorageReferencesSelect,
  rollupSchema,
  serializeBlobDataStorageReference,
  serializeDate,
  serializeDecimal,
  serializeRollup,
  serializedBlobDataStorageReferenceSchema,
  serializedDerivedTxBlobGasFieldsSchema,
  slotSchema,
} from "../utils";
import type {
  DerivedTxBlobGasFields,
  MakeFieldsMandatory,
  TypeOrEmpty,
} from "../utils";

const zodExpandEnums = ["blob", "block", "transaction"] as const;

const expandedTransactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  blobAsCalldataGasUsed: true,
  fromId: true,
  toId: true,
  gasPrice: true,
  maxFeePerBlobGas: true,
  rollup: true,
});

const expandedBlobSelect = Prisma.validator<Prisma.BlobSelect>()({
  commitment: true,
  proof: true,
  size: true,
  versionedHash: true,
  dataStorageReferences: {
    select: dataStorageReferencesSelect,
  },
});

const expandedBlockSelect = Prisma.validator<Prisma.BlockSelect>()({
  blobAsCalldataGasUsed: true,
  blobGasPrice: true,
  blobGasUsed: true,
  excessBlobGas: true,
  hash: true,
  timestamp: true,
  slot: true,
});

export type ExpandedBlock = MakeFieldsMandatory<DBBlock, "number">;

export type ExpandedTransaction = MakeFieldsMandatory<
  DBTransaction & DerivedTxBlobGasFields,
  "hash"
>;

export type ExpandedBlob = MakeFieldsMandatory<DBBlob, "versionedHash"> & {
  dataStorageReferences: Omit<BlobDataStorageReference, "blobHash">[];
  data?: string;
};

export type ZodExpand = (typeof zodExpandEnums)[number];

export type Expands = {
  expandedTransactionSelect: TypeOrEmpty<typeof expandedTransactionSelect>;
  expandedBlobSelect: TypeOrEmpty<typeof expandedBlobSelect>;
  expandedBlockSelect: TypeOrEmpty<typeof expandedBlockSelect>;
};

export const serializedExpandedBlockSchema = z.object({
  blobGasUsed: z.string().optional(),
  blobAsCalldataGasUsed: z.string().optional(),
  blobGasPrice: z.string().optional(),
  excessBlobGas: z.string().optional(),
  hash: z.string().optional(),
  timestamp: z.string().optional(),
  slot: slotSchema.optional(),
});

export const serializedExpandedBlobSchema = z.object({
  commitment: z.string().optional(),
  proof: z.string().nullable().optional(),
  size: z.number().optional(),
  dataStorageReferences: z
    .array(serializedBlobDataStorageReferenceSchema)
    .optional(),
  data: z.string().optional(),
});

export const serializedExpandedTransactionSchema = z
  .object({
    from: z.string().optional(),
    to: z.string().optional(),
    maxFeePerBlobGas: z.string().optional(),
    blobAsCalldataGasUsed: z.string().optional(),
    rollup: rollupSchema.optional(),
  })
  .merge(serializedDerivedTxBlobGasFieldsSchema);

export type SerializedExpandedBlob = z.infer<
  typeof serializedExpandedBlobSchema
>;

export type SerializedExpandedBlock = z.infer<
  typeof serializedExpandedBlockSchema
>;
export type SerializedExpandedTransaction = z.infer<
  typeof serializedExpandedTransactionSchema
>;

export function serializeExpandedBlob(
  blob: ExpandedBlob
): SerializedExpandedBlob {
  const { commitment, proof, size, dataStorageReferences, data } = blob;
  const expandedBlob: SerializedExpandedBlob = {};

  if (commitment) {
    expandedBlob.commitment = commitment;
  }

  if (proof) {
    expandedBlob.proof = proof;
  }

  if (size) {
    expandedBlob.size = size;
  }

  if (dataStorageReferences) {
    expandedBlob.dataStorageReferences = dataStorageReferences.map(
      serializeBlobDataStorageReference
    );
  }

  if (data) {
    expandedBlob.data = data;
  }

  return expandedBlob;
}

export function serializeExpandedBlock(
  block: ExpandedBlock
): SerializedExpandedBlock {
  const {
    blobGasPrice,
    blobAsCalldataGasUsed,
    blobGasUsed,
    excessBlobGas,
    hash,
    slot,
    timestamp,
  } = block;
  const expandedBlock: SerializedExpandedBlock = {};

  if (blobGasPrice) {
    expandedBlock.blobGasPrice = serializeDecimal(blobGasPrice);
  }

  if (blobAsCalldataGasUsed) {
    expandedBlock.blobAsCalldataGasUsed = serializeDecimal(
      blobAsCalldataGasUsed
    );
  }

  if (blobGasUsed) {
    expandedBlock.blobGasUsed = serializeDecimal(blobGasUsed);
  }

  if (excessBlobGas) {
    expandedBlock.excessBlobGas = serializeDecimal(excessBlobGas);
  }

  if (hash) {
    expandedBlock.hash = hash;
  }

  if (slot) {
    expandedBlock.slot = slot;
  }

  if (timestamp) {
    expandedBlock.timestamp = serializeDate(timestamp);
  }

  return expandedBlock;
}

export function serializeExpandedTransaction(
  transaction: ExpandedTransaction & DerivedTxBlobGasFields
): SerializedExpandedTransaction {
  const {
    blobAsCalldataGasUsed,
    maxFeePerBlobGas,
    fromId,
    toId,
    rollup,
    blobGasBaseFee,
    blobGasMaxFee,
    blobGasUsed,
  } = transaction;
  const expandedTransaction: SerializedExpandedTransaction = {};

  if (blobAsCalldataGasUsed) {
    expandedTransaction.blobAsCalldataGasUsed = serializeDecimal(
      blobAsCalldataGasUsed
    );
  }

  if (maxFeePerBlobGas) {
    expandedTransaction.maxFeePerBlobGas = serializeDecimal(maxFeePerBlobGas);
  }

  if (fromId) {
    expandedTransaction.from = fromId;
  }

  if (toId) {
    expandedTransaction.to = toId;
  }

  if (rollup) {
    expandedTransaction.rollup = serializeRollup(rollup);
  }

  if (blobGasBaseFee) {
    expandedTransaction.blobGasBaseFee = serializeDecimal(blobGasBaseFee);
  }

  if (blobGasMaxFee) {
    expandedTransaction.blobGasMaxFee = serializeDecimal(blobGasMaxFee);
  }

  if (blobGasUsed) {
    expandedTransaction.blobGasUsed = serializeDecimal(blobGasUsed);
  }

  return expandedTransaction;
}

export function createExpandKeysSchema(
  allowedExpands: ZodExpand[] = ["blob", "block", "transaction"]
) {
  return z.object({
    expand: z
      .string()
      .refine(
        (value) => {
          const values = value.split(",");

          return values.every((v) => allowedExpands.includes(v as ZodExpand));
        },
        {
          message: `Invalid 'expand' query search. It must be a comma separated list of the following values: ${allowedExpands.join(
            ", "
          )}`,
        }
      )
      .optional(),
  });
}

const allExpandKeysSchema = createExpandKeysSchema();

export const withExpands = t.middleware(({ next, input }) => {
  const expandResult = allExpandKeysSchema.safeParse(input);
  let expandKeys: ZodExpand[] = [];

  if (expandResult.success && expandResult.data.expand) {
    expandKeys = expandResult.data.expand
      .split(",")
      .map((expand) => expand as ZodExpand);
  }

  const expands = expandKeys.reduce<Expands>(
    (exp, current) => {
      switch (current) {
        case "transaction":
          exp.expandedTransactionSelect = expandedTransactionSelect;
          break;
        case "blob": {
          exp.expandedBlobSelect = expandedBlobSelect;
        }
        case "block": {
          exp.expandedBlockSelect = expandedBlockSelect;
        }
      }

      return exp;
    },
    {
      expandedTransactionSelect: {},
      expandedBlobSelect: {},
      expandedBlockSelect: {},
    }
  );

  return next({
    ctx: {
      expands,
    },
  });
});
