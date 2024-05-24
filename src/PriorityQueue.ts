
export class MinHeapPriorityQueue<T> {
    private heap: T[];
    private compare: (a: T, b: T) => number;

    constructor(compare: (a: T, b: T) => number) {
        this.heap = [];
        this.compare = compare;
    }

    private leftChildIndex(parentIndex: number): number {
        return 2 * parentIndex + 1;
    }

    private rightChildIndex(parentIndex: number): number {
        return 2 * parentIndex + 2;
    }

    private parentIndex(childIndex: number): number {
        return Math.floor((childIndex - 1) / 2);
    }

    private swap(index1: number, index2: number): void {
        [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
    }

    private heapifyUp(): void {
        let index = this.heap.length - 1;
        while (index > 0 && this.compare(this.heap[index], this.heap[this.parentIndex(index)]) < 0) {
            this.swap(index, this.parentIndex(index));
            index = this.parentIndex(index);
        }
    }

    private heapifyDown(): void {
        let index = 0;
        while (this.leftChildIndex(index) < this.heap.length) {
            let smallerChildIndex = this.leftChildIndex(index);
            if (this.rightChildIndex(index) < this.heap.length && this.compare(this.heap[this.rightChildIndex(index)], this.heap[smallerChildIndex]) < 0) {
                smallerChildIndex = this.rightChildIndex(index);
            }
            if (this.compare(this.heap[index], this.heap[smallerChildIndex]) <= 0) {
                break;
            }
            this.swap(index, smallerChildIndex);
            index = smallerChildIndex;
        }
    }

    public put(element: T): void {
        this.heap.push(element);
        this.heapifyUp();
    }

    public get(): T | null {
        if (this.heap.length === 0) return null;
        const min = this.heap[0];
        this.heap[0] = this.heap.pop()!;
        this.heapifyDown();
        return min;
    }

    public peek(): T | null {
        return this.heap.length > 0 ? this.heap[0] : null;
    }

    public isEmpty(): boolean {
        return this.heap.length === 0;
    }
}
