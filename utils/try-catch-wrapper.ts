// utils/try-catch-wrapper.ts

export async function tryCatch<T>(
  asyncFn: () => Promise<T>,
  onError?: (error: any) => void
): Promise<[T | null, Error | null]> {
  try {
    const result = await asyncFn();
    return [result, null];
  } catch (error) {
    const errorObj =
      error instanceof Error
        ? error
        : new Error(
            typeof error === "string" ? error : "Unknown error occurred"
          );

    if (onError) {
      onError(errorObj);
    }

    return [null, errorObj];
  }
}

export function asyncEventHandler<E>(
  asyncFn: (e: E) => Promise<any>,
  onSuccess?: (result: any) => void,
  onError?: (error: Error) => void
): (e: E) => void {
  return (e: E) => {
    if (e && typeof (e as any).preventDefault === "function") {
      (e as any).preventDefault();
    }

    asyncFn(e)
      .then((result) => {
        if (onSuccess) onSuccess(result);
      })
      .catch((error) => {
        const errorObj =
          error instanceof Error
            ? error
            : new Error(
                typeof error === "string" ? error : "Unknown error occurred"
              );

        console.error("Error in async event handler:", errorObj);

        if (onError) onError(errorObj);
      });
  };
}
