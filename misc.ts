/**
 * This is a wrapper around setTimeout() that works with await.
 *
 * `await sleep(100)`;
 * @param ms How long in milliseconds to sleep.
 * @returns A promise that you can wait on.
 */
export function sleep(ms: number) {
  // https://stackoverflow.com/a/39914235/971955
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * On success `parsed` points to the XML Document.
 * On success `error` points to an HTMLElement explaining the problem.
 * Exactly one of those two fields will be undefined.
 */
export type XmlStatus =
  | { parsed: Document; error?: undefined }
  | { parsed?: undefined; error: HTMLElement };

/**
 * Check if the input is a valid XML file.
 * @param xmlStr The input to be parsed.
 * @returns If the input valid, return the XML document.  If the input is invalid, this returns an HTMLElement explaining the problem.
 */
export function testXml(xmlStr: string): XmlStatus {
  const parser = new DOMParser();
  const dom = parser.parseFromString(xmlStr, "application/xml");
  // https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
  // says that parseFromString() will throw an error if the input is invalid.
  //
  // https://developer.mozilla.org/en-US/docs/Web/Guide/Parsing_and_serializing_XML
  // says dom.documentElement.nodeName == "parsererror" will be true if the input
  // is invalid.
  //
  // Neither of those is true when I tested it in Chrome.  Nothing is thrown.
  // If the input is "" I get:
  // dom.documentElement.nodeName returns "html",
  // doc.documentElement.firstElementChild.nodeName returns "body" and
  // doc.documentElement.firstElementChild.firstElementChild.nodeName = "parsererror".
  // It seems that the <parsererror> can move around.  It looks like it's trying to
  // create as much of the XML tree as it can, then it inserts <parsererror> whenever
  // and wherever it gets stuck.  It sometimes generates additional XML after the
  // parsererror, so .lastElementChild might not find the problem.
  //
  // In case of an error the <parsererror> element will be an instance of
  // HTMLElement.  A valid XML document can include an element with name name
  // "parsererror", however it will NOT be an instance of HTMLElement.
  //
  // getElementsByTagName('parsererror') might be faster than querySelectorAll().
  for (const element of Array.from(dom.querySelectorAll("parsererror"))) {
    if (element instanceof HTMLElement) {
      // Found the error.
      return { error: element };
    }
  }
  // No errors found.
  return { parsed: dom };
}

/**
 * Pick any arbitrary element from the set.
 * @param set
 * @returns An item in the set.  Unless the set is empty, then it returns undefined.
 */
export function pickAny<T>(set: ReadonlySet<T>): T | undefined {
  const first = set.values().next();
  if (first.done) {
    return undefined;
  } else {
    return first.value;
  }
}

/**
 *
 * @param array Pick from here.
 * @returns A randomly selected element of the array.
 * @throws An error if the array is empty.
 */
export function pick<T>(array: ArrayLike<T>): T {
  return array[(Math.random() * array.length) | 0];
}

/**
 * This is like calling `input.map(transform).filter(item => item !=== undefined)`.
 * But if I used that line typescript would get the output type wrong.
 * `Array.prototype.flatMap()` is a standard and traditional alternative.
 * @param input The values to be handed to `transform()` one at a time.
 * @param transform The function to be called on each input.
 * `index` is the index of the current input, just like in Array.prototype.forEach().
 * @returns The items returned by `transform()`, with any undefined items removed.
 */
export function filterMap<Input, Output>(
  input: Input[],
  transform: (input: Input, index: number) => Output | undefined
) {
  const result: Output[] = [];
  input.forEach((input, index) => {
    const possibleElement = transform(input, index);
    if (undefined !== possibleElement) {
      result.push(possibleElement);
    }
  });
  return result;
}

/**
 * Easier than `new Promise()`.
 * @returns An object including a promise and the methods to resolve or reject that promise.
 */
export function makePromise<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((resolve1, reject1) => {
    resolve = resolve1;
    reject = reject1;
  });
  return { promise, resolve, reject };
}

/**
 * Fri Sep 12 275760 17:00:00 GMT-0700 (Pacific Daylight Time)
 * This is a value commonly used as the largest date.
 *
 * Strictly speaking this could get a little higher, but this is what is always used on the internet.
 *
 * Warning:  If you pass this value to MySQL it will overflow and fail poorly.
 */
export const MAX_DATE = new Date(8640000000000000);

/**
 * Mon Apr 19 -271821 16:07:02 GMT-0752 (Pacific Daylight Time)
 * This is a value commonly used as the smallest date.
 *
 * Strictly speaking this could get a little lower, but this is what is always used on the internet.
 *
 * Warning:  If you pass this value to MySQL it will overflow and fail poorly.
 */
export const MIN_DATE = new Date(-8640000000000000);

export function dateIsValid(date: Date): boolean {
  return isFinite(date.getTime());
}

/**
 * Looks like a space.  But otherwise treated like a normal character.
 * In particular, HTML will __not__ combine multiple `NON_BREAKING_SPACE` characters like it does for normal spaces.
 *
 * If you are writing to element.innerHTML you could use "&amp;nbsp;" to get the same result.  If you are writing to
 * element.innerText or anything that is not HTML, you need to use this constant.
 *
 * Google slides still treats this like a normal space. 🙁
 * 
 * ![Comparison of different types of spaces.](https://raw.githubusercontent.com/TradeIdeasPhilip/lib/master/space-sample.png)
 */
export const NON_BREAKING_SPACE = "\xa0";

/**
 * Looks like a space.  Is the width of a digit.
 * 
 * HTML completely ignores some “normal” spaces.
 * HTML always draws a figure space.
 * 
 * ![Comparison of different types of spaces.](https://raw.githubusercontent.com/TradeIdeasPhilip/lib/master/space-sample.png)
 */
export const FIGURE_SPACE = "\u2007";

// https://dev.to/chrismilson/zip-iterator-in-typescript-ldm
type Iterableify<T> = { [K in keyof T]: Iterable<T[K]> };
/**
 * Given a list of iterables, make a single iterable.
 * The resulting iterable will contain arrays.
 * The first entry in the output will contain the first entry in each of the inputs.
 * The nth entry in the output will contain the nth entry in each of the inputs.
 * This will stop iterating when the first of the inputs runs out of data.
 * ```
 *   for (const [rowHeader, rowBody] of zip(sharedStuff.rowHeaders, thisTable.rowBodies)) {
 *     ...
 *   }
 * ```
 * @param toZip Any number of iterables.
 */
export function* zip<T extends Array<any>>(
  ...toZip: Iterableify<T>
): Generator<T> {
  // Get iterators for all of the iterables.
  const iterators = toZip.map((i) => i[Symbol.iterator]());

  while (true) {
    // Advance all of the iterators.
    const results = iterators.map((i) => i.next());

    // If any of the iterators are done, we should stop.
    if (results.some(({ done }) => done)) {
      break;
    }

    // We can assert the yield type, since we know none
    // of the iterators are done.
    yield results.map(({ value }) => value) as T;
  }
}

export function* count(start = 0, end = Infinity, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

/**
 * Create and initialize an array.
 * @param count The number of items in the array.
 * @param callback A function which will take the (zero based) array index as an input and will return the value to put into the array at that index.
 * @returns An array containing all of the results.
 */
export function initializedArray<T>(count: number, callback: (index: number) => T): T[] {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(callback(i));
  }
  return result;
}

/**
 * @deprecated Use `initializedArray()`.  `countMap` was my first attempt at a name and I don't like it!
 */
export const countMap = initializedArray;

export function sum(items: number[]): number {
  return items.reduce((accumulator, current) => accumulator + current, 0);
}

/**
 * For use with `makeLinear()`.
 */
type LinearFunction = (x: number) => number;

/**
 * Linear interpolation and extrapolation.
 *
 * Given two points, this function will find the line that lines on those two points.
 * And it will return a function that will find all points on that line.
 * @param x1 One valid input.
 * @param y1 The expected output at x1.
 * @param x2 Another valid input.  Must differ from x2.
 * @param y2 The expected output at x2.
 * @returns A function of a line.  Give an x as input and it will return the expected y.
 * ![Inputs and outputs of makeLinear()](https://raw.githubusercontent.com/TradeIdeasPhilip/lib/master/makeLinear.png)
 */
export function makeLinear(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): LinearFunction {
  const slope = (y2 - y1) / (x2 - x1);
  return function (x: number) {
    return (x - x1) * slope + y1;
  };
}

/**
 * Linear interpolation.
 *
 * Given two points, this function will find the line segment that connects the two points.
 * @param x1 One valid input.
 * @param y1 The expected output at x1.
 * @param x2 Another valid input.
 * @param y2 The expected output at x2.
 * @returns A function that takes x as an input.
 * If x is between x1 and x2, return the corresponding y from the line segment.
 * Outside of the line segment, the function is flat.
 * I.e. f(-Infinity) == f(min(x1,x2) - 100) == f(min(x1,x2)).
 * And f(Infinity) == f(max(x1,x2) + 100) == f(max(x1,x2)).
 * ![Inputs and outputs of makeBoundedLinear()](https://raw.githubusercontent.com/TradeIdeasPhilip/lib/master/makeBoundedLinear.png)
 */
 export function makeBoundedLinear(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): LinearFunction {
  if (x2 < x1) {
    [x1, y1, x2, y2] = [x2, y2, x1, y1];
  }
  // Now x1 <= x2;
  const slope = (y2 - y1) / (x2 - x1);
  return function (x: number) {
    if (x <= x1) {
      return y1;
    } else if (x >= x2) {
      return y2;
    } else {
      return (x - x1) * slope + y1;
    }
  };
}

export function polarToRectangular(r: number, θ: number) {
  return { x: Math.sin(θ) * r, y: Math.cos(θ) * r };
}