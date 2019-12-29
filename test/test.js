/**
 * Unit tests for pure (functional) components.
 * @module test/test
 */

'use strict';

var assert = require('assert');
var expect = require('chai').expect;

const fs = require('fs').promises;

const bits = require('../src/data/bits');
const gate = require('../src/data/gate');
const circuit = require('../src/data/circuit');
const label = require('../src/data/label');
const association = require('../src/data/association');
const channel = require('../src/comm/channel');
const garble = require('../src/garble');
const evaluate = require('../src/evaluate');

var and4_bristol = "3 7\n2 2 2\n1 1\n2 1 0 1 4 AND\n2 1 2 3 5 AND\n2 1 4 5 6 AND";
var and4_json = {
  "gate_count": 3, "wire_count": 7,
  "input_count": 2, "input_lengths": [2,2],
  "output_count": 1, "output_lengths": [1],
  "input_wires": [1, 2, 3, 4], "output_wires": [7],
  "gates": [
    {"operation": "and", "input_wires": [1,2], "output_wire": 5},
    {"operation": "and", "input_wires": [3,4], "output_wire": 6},
    {"operation": "and", "input_wires": [5,6], "output_wire": 7}
  ]
};

var add32_bristol = "375 439\n2 32 32\n1 33\n2 1 0 32 406 XOR\n2 1 5 37 373 AND\n2 1 4 36 336 AND\n2 1 10 42 340 AND\n2 1 14 46 366 AND\n2 1 24 56 341 AND\n2 1 8 40 342 AND\n2 1 1 33 343 AND\n2 1 7 39 348 AND\n2 1 28 60 349 AND\n2 1 19 51 350 AND\n2 1 2 34 351 AND\n2 1 30 62 364 AND\n2 1 13 45 352 AND\n2 1 18 50 353 AND\n2 1 11 43 355 AND\n2 1 3 35 356 AND\n2 1 16 48 359 AND\n2 1 31 63 357 AND\n2 1 27 59 358 AND\n2 1 15 47 360 AND\n2 1 17 49 361 AND\n2 1 9 41 363 AND\n2 1 32 0 278 AND\n2 1 29 61 362 AND\n2 1 6 38 365 AND\n2 1 25 57 354 AND\n2 1 20 52 367 AND\n2 1 22 54 331 AND\n2 1 21 53 371 AND\n2 1 12 44 372 AND\n2 1 23 55 339 AND\n2 1 26 58 368 AND\n1 1 56 398 INV\n1 1 3 314 INV\n1 1 40 346 INV\n1 1 62 378 INV\n1 1 6 389 INV\n1 1 28 401 INV\n1 1 10 377 INV\n1 1 13 391 INV\n1 1 27 335 INV\n1 1 7 387 INV\n1 1 24 399 INV\n1 1 54 327 INV\n1 1 36 315 INV\n1 1 52 332 INV\n1 1 50 380 INV\n1 1 57 404 INV\n1 1 31 323 INV\n1 1 55 317 INV\n1 1 18 381 INV\n1 1 60 400 INV\n1 1 5 322 INV\n1 1 14 395 INV\n1 1 47 402 INV\n1 1 8 347 INV\n1 1 19 385 INV\n1 1 53 374 INV\n1 1 29 330 INV\n1 1 1 382 INV\n1 1 34 344 INV\n1 1 20 333 INV\n1 1 37 321 INV\n1 1 45 390 INV\n1 1 11 338 INV\n1 1 42 376 INV\n1 1 12 370 INV\n1 1 38 388 INV\n1 1 23 318 INV\n1 1 41 392 INV\n1 1 61 329 INV\n1 1 15 403 INV\n1 1 48 396 INV\n1 1 26 320 INV\n1 1 43 337 INV\n1 1 59 334 INV\n1 1 9 393 INV\n1 1 58 319 INV\n1 1 17 326 INV\n1 1 44 369 INV\n1 1 21 375 INV\n1 1 49 325 INV\n1 1 16 397 INV\n1 1 25 405 INV\n1 1 51 384 INV\n1 1 4 316 INV\n1 1 2 345 INV\n1 1 39 386 INV\n1 1 46 394 INV\n1 1 35 313 INV\n1 1 22 328 INV\n1 1 63 324 INV\n1 1 33 383 INV\n1 1 30 379 INV\n2 1 313 314 282 AND\n2 1 315 316 283 AND\n2 1 317 318 284 AND\n2 1 319 320 299 AND\n2 1 321 322 285 AND\n2 1 323 324 286 AND\n2 1 325 326 288 AND\n2 1 327 328 289 AND\n2 1 329 330 290 AND\n1 1 331 130 INV\n2 1 332 333 287 AND\n2 1 334 335 292 AND\n1 1 336 256 INV\n2 1 337 338 293 AND\n1 1 339 123 INV\n1 1 340 214 INV\n1 1 341 116 INV\n1 1 342 228 INV\n1 1 343 276 INV\n2 1 344 345 310 AND\n2 1 346 347 300 AND\n1 1 348 235 INV\n1 1 349 88 INV\n1 1 350 151 INV\n1 1 351 270 INV\n1 1 352 193 INV\n1 1 353 158 INV\n1 1 354 109 INV\n1 1 355 207 INV\n1 1 356 263 INV\n1 1 357 66 INV\n1 1 358 95 INV\n1 1 359 172 INV\n1 1 360 179 INV\n1 1 361 165 INV\n1 1 362 81 INV\n1 1 363 221 INV\n1 1 364 74 INV\n1 1 365 242 INV\n1 1 366 186 INV\n1 1 367 144 INV\n1 1 368 102 INV\n2 1 369 370 301 AND\n1 1 371 137 INV\n1 1 372 200 INV\n1 1 373 249 INV\n2 1 374 375 298 AND\n2 1 376 377 296 AND\n2 1 378 379 291 AND\n2 1 380 381 297 AND\n2 1 382 383 306 AND\n2 1 384 385 294 AND\n2 1 386 387 295 AND\n2 1 388 389 302 AND\n2 1 390 391 303 AND\n2 1 392 393 304 AND\n2 1 394 395 305 AND\n2 1 396 397 307 AND\n2 1 398 399 308 AND\n2 1 400 401 309 AND\n2 1 402 403 311 AND\n2 1 404 405 312 AND\n1 1 282 266 INV\n1 1 283 259 INV\n1 1 284 126 INV\n1 1 285 252 INV\n1 1 286 69 INV\n1 1 287 147 INV\n1 1 288 168 INV\n1 1 289 133 INV\n1 1 290 84 INV\n1 1 291 77 INV\n1 1 292 98 INV\n1 1 293 210 INV\n1 1 294 154 INV\n1 1 295 238 INV\n1 1 296 217 INV\n1 1 297 161 INV\n1 1 298 140 INV\n1 1 299 105 INV\n1 1 300 231 INV\n1 1 301 203 INV\n1 1 302 245 INV\n1 1 303 196 INV\n1 1 304 224 INV\n1 1 305 189 INV\n1 1 306 281 INV\n1 1 307 175 INV\n1 1 308 119 INV\n1 1 309 91 INV\n1 1 310 273 INV\n1 1 311 182 INV\n1 1 312 112 INV\n2 1 281 276 277 AND\n2 1 69 66 279 AND\n2 1 281 278 280 AND\n2 1 277 278 407 XOR\n1 1 279 71 INV\n1 1 280 275 INV\n2 1 275 276 274 AND\n1 1 274 271 INV\n2 1 2 271 268 XOR\n2 1 271 273 272 AND\n2 1 34 268 408 XOR\n1 1 272 269 INV\n2 1 269 270 267 AND\n1 1 267 264 INV\n2 1 3 264 261 XOR\n2 1 264 266 265 AND\n2 1 35 261 409 XOR\n1 1 265 262 INV\n2 1 262 263 260 AND\n1 1 260 257 INV\n2 1 4 257 253 XOR\n2 1 257 259 258 AND\n2 1 36 253 410 XOR\n1 1 258 255 INV\n2 1 255 256 254 AND\n1 1 254 250 INV\n2 1 5 250 247 XOR\n2 1 250 252 251 AND\n2 1 37 247 411 XOR\n1 1 251 248 INV\n2 1 248 249 246 AND\n1 1 246 243 INV\n2 1 6 243 239 XOR\n2 1 243 245 244 AND\n2 1 38 239 412 XOR\n1 1 244 241 INV\n2 1 241 242 240 AND\n1 1 240 236 INV\n2 1 7 236 233 XOR\n2 1 236 238 237 AND\n2 1 39 233 413 XOR\n1 1 237 234 INV\n2 1 234 235 232 AND\n1 1 232 229 INV\n2 1 8 229 226 XOR\n2 1 229 231 230 AND\n2 1 40 226 414 XOR\n1 1 230 227 INV\n2 1 227 228 225 AND\n1 1 225 222 INV\n2 1 9 222 219 XOR\n2 1 222 224 223 AND\n2 1 41 219 415 XOR\n1 1 223 220 INV\n2 1 220 221 218 AND\n1 1 218 215 INV\n2 1 10 215 212 XOR\n2 1 215 217 216 AND\n2 1 42 212 416 XOR\n1 1 216 213 INV\n2 1 213 214 211 AND\n1 1 211 208 INV\n2 1 11 208 205 XOR\n2 1 208 210 209 AND\n2 1 43 205 417 XOR\n1 1 209 206 INV\n2 1 206 207 204 AND\n1 1 204 201 INV\n2 1 12 201 198 XOR\n2 1 201 203 202 AND\n2 1 44 198 418 XOR\n1 1 202 199 INV\n2 1 199 200 197 AND\n1 1 197 195 INV\n2 1 13 195 190 XOR\n2 1 195 196 194 AND\n2 1 45 190 419 XOR\n1 1 194 192 INV\n2 1 192 193 191 AND\n1 1 191 187 INV\n2 1 14 187 183 XOR\n2 1 187 189 188 AND\n2 1 46 183 420 XOR\n1 1 188 185 INV\n2 1 185 186 184 AND\n1 1 184 180 INV\n2 1 15 180 177 XOR\n2 1 180 182 181 AND\n2 1 47 177 421 XOR\n1 1 181 178 INV\n2 1 178 179 176 AND\n1 1 176 173 INV\n2 1 48 173 170 XOR\n2 1 173 175 174 AND\n2 1 16 170 422 XOR\n1 1 174 171 INV\n2 1 171 172 169 AND\n1 1 169 166 INV\n2 1 17 166 163 XOR\n2 1 166 168 167 AND\n2 1 49 163 423 XOR\n1 1 167 164 INV\n2 1 164 165 162 AND\n1 1 162 159 INV\n2 1 18 159 156 XOR\n2 1 159 161 160 AND\n2 1 50 156 424 XOR\n1 1 160 157 INV\n2 1 157 158 155 AND\n1 1 155 152 INV\n2 1 19 152 149 XOR\n2 1 152 154 153 AND\n2 1 51 149 425 XOR\n1 1 153 150 INV\n2 1 150 151 148 AND\n1 1 148 145 INV\n2 1 20 145 141 XOR\n2 1 145 147 146 AND\n2 1 52 141 426 XOR\n1 1 146 143 INV\n2 1 143 144 142 AND\n1 1 142 138 INV\n2 1 53 138 135 XOR\n2 1 138 140 139 AND\n2 1 21 135 427 XOR\n1 1 139 136 INV\n2 1 136 137 134 AND\n1 1 134 132 INV\n2 1 22 132 127 XOR\n2 1 132 133 131 AND\n2 1 54 127 428 XOR\n1 1 131 129 INV\n2 1 129 130 128 AND\n1 1 128 124 INV\n2 1 23 124 121 XOR\n2 1 124 126 125 AND\n2 1 55 121 429 XOR\n1 1 125 122 INV\n2 1 122 123 120 AND\n1 1 120 117 INV\n2 1 24 117 114 XOR\n2 1 117 119 118 AND\n2 1 56 114 430 XOR\n1 1 118 115 INV\n2 1 115 116 113 AND\n1 1 113 110 INV\n2 1 25 110 107 XOR\n2 1 110 112 111 AND\n2 1 57 107 431 XOR\n1 1 111 108 INV\n2 1 108 109 106 AND\n1 1 106 103 INV\n2 1 26 103 100 XOR\n2 1 103 105 104 AND\n2 1 58 100 432 XOR\n1 1 104 101 INV\n2 1 101 102 99 AND\n1 1 99 96 INV\n2 1 59 96 93 XOR\n2 1 96 98 97 AND\n2 1 27 93 433 XOR\n1 1 97 94 INV\n2 1 94 95 92 AND\n1 1 92 89 INV\n2 1 28 89 86 XOR\n2 1 89 91 90 AND\n2 1 60 86 434 XOR\n1 1 90 87 INV\n2 1 87 88 85 AND\n1 1 85 83 INV\n2 1 61 83 79 XOR\n2 1 83 84 82 AND\n2 1 29 79 435 XOR\n1 1 82 80 INV\n2 1 80 81 78 AND\n1 1 78 76 INV\n2 1 30 76 72 XOR\n2 1 76 77 75 AND\n2 1 62 72 436 XOR\n1 1 75 73 INV\n2 1 73 74 70 AND\n2 1 70 71 437 XOR\n1 1 70 68 INV\n2 1 68 69 67 AND\n1 1 67 65 INV\n2 1 65 66 64 AND\n1 1 64 438 INV";
var add32_json = {
  "wire_count":439,
  "gate_count":375,
  "input_count":2,
  "input_lengths":[32,32],
  "output_count":1,
  "output_lengths":[33],
  "input_wires":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64],
  "output_wires":[407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439],
  "gates":[
    {"input_wires":[1,33], "output_wire":407, "operation":"xor"},
    {"input_wires":[6,38], "output_wire":374, "operation":"and"},
    {"input_wires":[5,37], "output_wire":337, "operation":"and"},
    {"input_wires":[11,43], "output_wire":341, "operation":"and"},
    {"input_wires":[15,47], "output_wire":367, "operation":"and"},
    {"input_wires":[25,57], "output_wire":342, "operation":"and"},
    {"input_wires":[9,41], "output_wire":343, "operation":"and"},
    {"input_wires":[2,34], "output_wire":344, "operation":"and"},
    {"input_wires":[8,40], "output_wire":349, "operation":"and"},
    {"input_wires":[29,61], "output_wire":350, "operation":"and"},
    {"input_wires":[20,52], "output_wire":351, "operation":"and"},
    {"input_wires":[3,35], "output_wire":352, "operation":"and"},
    {"input_wires":[31,63], "output_wire":365, "operation":"and"},
    {"input_wires":[14,46], "output_wire":353, "operation":"and"},
    {"input_wires":[19,51], "output_wire":354, "operation":"and"},
    {"input_wires":[12,44], "output_wire":356, "operation":"and"},
    {"input_wires":[4,36], "output_wire":357, "operation":"and"},
    {"input_wires":[17,49], "output_wire":360, "operation":"and"},
    {"input_wires":[32,64], "output_wire":358, "operation":"and"},
    {"input_wires":[28,60], "output_wire":359, "operation":"and"},
    {"input_wires":[16,48], "output_wire":361, "operation":"and"},
    {"input_wires":[18,50], "output_wire":362, "operation":"and"},
    {"input_wires":[10,42], "output_wire":364, "operation":"and"},
    {"input_wires":[33,1], "output_wire":279, "operation":"and"},
    {"input_wires":[30,62], "output_wire":363, "operation":"and"},
    {"input_wires":[7,39], "output_wire":366, "operation":"and"},
    {"input_wires":[26,58], "output_wire":355, "operation":"and"},
    {"input_wires":[21,53], "output_wire":368, "operation":"and"},
    {"input_wires":[23,55], "output_wire":332, "operation":"and"},
    {"input_wires":[22,54], "output_wire":372, "operation":"and"},
    {"input_wires":[13,45], "output_wire":373, "operation":"and"},
    {"input_wires":[24,56], "output_wire":340, "operation":"and"},
    {"input_wires":[27,59], "output_wire":369, "operation":"and"},
    {"input_wires":[57], "output_wire":399, "operation":"not"},
    {"input_wires":[4], "output_wire":315, "operation":"not"},
    {"input_wires":[41], "output_wire":347, "operation":"not"},
    {"input_wires":[63], "output_wire":379, "operation":"not"},
    {"input_wires":[7], "output_wire":390, "operation":"not"},
    {"input_wires":[29], "output_wire":402, "operation":"not"},
    {"input_wires":[11], "output_wire":378, "operation":"not"},
    {"input_wires":[14], "output_wire":392, "operation":"not"},
    {"input_wires":[28], "output_wire":336, "operation":"not"},
    {"input_wires":[8], "output_wire":388, "operation":"not"},
    {"input_wires":[25], "output_wire":400, "operation":"not"},
    {"input_wires":[55], "output_wire":328, "operation":"not"},
    {"input_wires":[37], "output_wire":316, "operation":"not"},
    {"input_wires":[53], "output_wire":333, "operation":"not"},
    {"input_wires":[51], "output_wire":381, "operation":"not"},
    {"input_wires":[58], "output_wire":405, "operation":"not"},
    {"input_wires":[32], "output_wire":324, "operation":"not"},
    {"input_wires":[56], "output_wire":318, "operation":"not"},
    {"input_wires":[19], "output_wire":382, "operation":"not"},
    {"input_wires":[61], "output_wire":401, "operation":"not"},
    {"input_wires":[6], "output_wire":323, "operation":"not"},
    {"input_wires":[15], "output_wire":396, "operation":"not"},
    {"input_wires":[48], "output_wire":403, "operation":"not"},
    {"input_wires":[9], "output_wire":348, "operation":"not"},
    {"input_wires":[20], "output_wire":386, "operation":"not"},
    {"input_wires":[54], "output_wire":375, "operation":"not"},
    {"input_wires":[30], "output_wire":331, "operation":"not"},
    {"input_wires":[2], "output_wire":383, "operation":"not"},
    {"input_wires":[35], "output_wire":345, "operation":"not"},
    {"input_wires":[21], "output_wire":334, "operation":"not"},
    {"input_wires":[38], "output_wire":322, "operation":"not"},
    {"input_wires":[46], "output_wire":391, "operation":"not"},
    {"input_wires":[12], "output_wire":339, "operation":"not"},
    {"input_wires":[43], "output_wire":377, "operation":"not"},
    {"input_wires":[13], "output_wire":371, "operation":"not"},
    {"input_wires":[39], "output_wire":389, "operation":"not"},
    {"input_wires":[24], "output_wire":319, "operation":"not"},
    {"input_wires":[42], "output_wire":393, "operation":"not"},
    {"input_wires":[62], "output_wire":330, "operation":"not"},
    {"input_wires":[16], "output_wire":404, "operation":"not"},
    {"input_wires":[49], "output_wire":397, "operation":"not"},
    {"input_wires":[27], "output_wire":321, "operation":"not"},
    {"input_wires":[44], "output_wire":338, "operation":"not"},
    {"input_wires":[60], "output_wire":335, "operation":"not"},
    {"input_wires":[10], "output_wire":394, "operation":"not"},
    {"input_wires":[59], "output_wire":320, "operation":"not"},
    {"input_wires":[18], "output_wire":327, "operation":"not"},
    {"input_wires":[45], "output_wire":370, "operation":"not"},
    {"input_wires":[22], "output_wire":376, "operation":"not"},
    {"input_wires":[50], "output_wire":326, "operation":"not"},
    {"input_wires":[17], "output_wire":398, "operation":"not"},
    {"input_wires":[26], "output_wire":406, "operation":"not"},
    {"input_wires":[52], "output_wire":385, "operation":"not"},
    {"input_wires":[5], "output_wire":317, "operation":"not"},
    {"input_wires":[3], "output_wire":346, "operation":"not"},
    {"input_wires":[40], "output_wire":387, "operation":"not"},
    {"input_wires":[47], "output_wire":395, "operation":"not"},
    {"input_wires":[36], "output_wire":314, "operation":"not"},
    {"input_wires":[23], "output_wire":329, "operation":"not"},
    {"input_wires":[64], "output_wire":325, "operation":"not"},
    {"input_wires":[34], "output_wire":384, "operation":"not"},
    {"input_wires":[31], "output_wire":380, "operation":"not"},
    {"input_wires":[314,315], "output_wire":283, "operation":"and"},
    {"input_wires":[316,317], "output_wire":284, "operation":"and"},
    {"input_wires":[318,319], "output_wire":285, "operation":"and"},
    {"input_wires":[320,321], "output_wire":300, "operation":"and"},
    {"input_wires":[322,323], "output_wire":286, "operation":"and"},
    {"input_wires":[324,325], "output_wire":287, "operation":"and"},
    {"input_wires":[326,327], "output_wire":289, "operation":"and"},
    {"input_wires":[328,329], "output_wire":290, "operation":"and"},
    {"input_wires":[330,331], "output_wire":291, "operation":"and"},
    {"input_wires":[332], "output_wire":131, "operation":"not"},
    {"input_wires":[333,334], "output_wire":288, "operation":"and"},
    {"input_wires":[335,336], "output_wire":293, "operation":"and"},
    {"input_wires":[337], "output_wire":257, "operation":"not"},
    {"input_wires":[338,339], "output_wire":294, "operation":"and"},
    {"input_wires":[340], "output_wire":124, "operation":"not"},
    {"input_wires":[341], "output_wire":215, "operation":"not"},
    {"input_wires":[342], "output_wire":117, "operation":"not"},
    {"input_wires":[343], "output_wire":229, "operation":"not"},
    {"input_wires":[344], "output_wire":277, "operation":"not"},
    {"input_wires":[345,346], "output_wire":311, "operation":"and"},
    {"input_wires":[347,348], "output_wire":301, "operation":"and"},
    {"input_wires":[349], "output_wire":236, "operation":"not"},
    {"input_wires":[350], "output_wire":89, "operation":"not"},
    {"input_wires":[351], "output_wire":152, "operation":"not"},
    {"input_wires":[352], "output_wire":271, "operation":"not"},
    {"input_wires":[353], "output_wire":194, "operation":"not"},
    {"input_wires":[354], "output_wire":159, "operation":"not"},
    {"input_wires":[355], "output_wire":110, "operation":"not"},
    {"input_wires":[356], "output_wire":208, "operation":"not"},
    {"input_wires":[357], "output_wire":264, "operation":"not"},
    {"input_wires":[358], "output_wire":67, "operation":"not"},
    {"input_wires":[359], "output_wire":96, "operation":"not"},
    {"input_wires":[360], "output_wire":173, "operation":"not"},
    {"input_wires":[361], "output_wire":180, "operation":"not"},
    {"input_wires":[362], "output_wire":166, "operation":"not"},
    {"input_wires":[363], "output_wire":82, "operation":"not"},
    {"input_wires":[364], "output_wire":222, "operation":"not"},
    {"input_wires":[365], "output_wire":75, "operation":"not"},
    {"input_wires":[366], "output_wire":243, "operation":"not"},
    {"input_wires":[367], "output_wire":187, "operation":"not"},
    {"input_wires":[368], "output_wire":145, "operation":"not"},
    {"input_wires":[369], "output_wire":103, "operation":"not"},
    {"input_wires":[370,371], "output_wire":302, "operation":"and"},
    {"input_wires":[372], "output_wire":138, "operation":"not"},
    {"input_wires":[373], "output_wire":201, "operation":"not"},
    {"input_wires":[374], "output_wire":250, "operation":"not"},
    {"input_wires":[375,376], "output_wire":299, "operation":"and"},
    {"input_wires":[377,378], "output_wire":297, "operation":"and"},
    {"input_wires":[379,380], "output_wire":292, "operation":"and"},
    {"input_wires":[381,382], "output_wire":298, "operation":"and"},
    {"input_wires":[383,384], "output_wire":307, "operation":"and"},
    {"input_wires":[385,386], "output_wire":295, "operation":"and"},
    {"input_wires":[387,388], "output_wire":296, "operation":"and"},
    {"input_wires":[389,390], "output_wire":303, "operation":"and"},
    {"input_wires":[391,392], "output_wire":304, "operation":"and"},
    {"input_wires":[393,394], "output_wire":305, "operation":"and"},
    {"input_wires":[395,396], "output_wire":306, "operation":"and"},
    {"input_wires":[397,398], "output_wire":308, "operation":"and"},
    {"input_wires":[399,400], "output_wire":309, "operation":"and"},
    {"input_wires":[401,402], "output_wire":310, "operation":"and"},
    {"input_wires":[403,404], "output_wire":312, "operation":"and"},
    {"input_wires":[405,406], "output_wire":313, "operation":"and"},
    {"input_wires":[283], "output_wire":267, "operation":"not"},
    {"input_wires":[284], "output_wire":260, "operation":"not"},
    {"input_wires":[285], "output_wire":127, "operation":"not"},
    {"input_wires":[286], "output_wire":253, "operation":"not"},
    {"input_wires":[287], "output_wire":70, "operation":"not"},
    {"input_wires":[288], "output_wire":148, "operation":"not"},
    {"input_wires":[289], "output_wire":169, "operation":"not"},
    {"input_wires":[290], "output_wire":134, "operation":"not"},
    {"input_wires":[291], "output_wire":85, "operation":"not"},
    {"input_wires":[292], "output_wire":78, "operation":"not"},
    {"input_wires":[293], "output_wire":99, "operation":"not"},
    {"input_wires":[294], "output_wire":211, "operation":"not"},
    {"input_wires":[295], "output_wire":155, "operation":"not"},
    {"input_wires":[296], "output_wire":239, "operation":"not"},
    {"input_wires":[297], "output_wire":218, "operation":"not"},
    {"input_wires":[298], "output_wire":162, "operation":"not"},
    {"input_wires":[299], "output_wire":141, "operation":"not"},
    {"input_wires":[300], "output_wire":106, "operation":"not"},
    {"input_wires":[301], "output_wire":232, "operation":"not"},
    {"input_wires":[302], "output_wire":204, "operation":"not"},
    {"input_wires":[303], "output_wire":246, "operation":"not"},
    {"input_wires":[304], "output_wire":197, "operation":"not"},
    {"input_wires":[305], "output_wire":225, "operation":"not"},
    {"input_wires":[306], "output_wire":190, "operation":"not"},
    {"input_wires":[307], "output_wire":282, "operation":"not"},
    {"input_wires":[308], "output_wire":176, "operation":"not"},
    {"input_wires":[309], "output_wire":120, "operation":"not"},
    {"input_wires":[310], "output_wire":92, "operation":"not"},
    {"input_wires":[311], "output_wire":274, "operation":"not"},
    {"input_wires":[312], "output_wire":183, "operation":"not"},
    {"input_wires":[313], "output_wire":113, "operation":"not"},
    {"input_wires":[282,277], "output_wire":278, "operation":"and"},
    {"input_wires":[70,67], "output_wire":280, "operation":"and"},
    {"input_wires":[282,279], "output_wire":281, "operation":"and"},
    {"input_wires":[278,279], "output_wire":408, "operation":"xor"},
    {"input_wires":[280], "output_wire":72, "operation":"not"},
    {"input_wires":[281], "output_wire":276, "operation":"not"},
    {"input_wires":[276,277], "output_wire":275, "operation":"and"},
    {"input_wires":[275], "output_wire":272, "operation":"not"},
    {"input_wires":[3,272], "output_wire":269, "operation":"xor"},
    {"input_wires":[272,274], "output_wire":273, "operation":"and"},
    {"input_wires":[35,269], "output_wire":409, "operation":"xor"},
    {"input_wires":[273], "output_wire":270, "operation":"not"},
    {"input_wires":[270,271], "output_wire":268, "operation":"and"},
    {"input_wires":[268], "output_wire":265, "operation":"not"},
    {"input_wires":[4,265], "output_wire":262, "operation":"xor"},
    {"input_wires":[265,267], "output_wire":266, "operation":"and"},
    {"input_wires":[36,262], "output_wire":410, "operation":"xor"},
    {"input_wires":[266], "output_wire":263, "operation":"not"},
    {"input_wires":[263,264], "output_wire":261, "operation":"and"},
    {"input_wires":[261], "output_wire":258, "operation":"not"},
    {"input_wires":[5,258], "output_wire":254, "operation":"xor"},
    {"input_wires":[258,260], "output_wire":259, "operation":"and"},
    {"input_wires":[37,254], "output_wire":411, "operation":"xor"},
    {"input_wires":[259], "output_wire":256, "operation":"not"},
    {"input_wires":[256,257], "output_wire":255, "operation":"and"},
    {"input_wires":[255], "output_wire":251, "operation":"not"},
    {"input_wires":[6,251], "output_wire":248, "operation":"xor"},
    {"input_wires":[251,253], "output_wire":252, "operation":"and"},
    {"input_wires":[38,248], "output_wire":412, "operation":"xor"},
    {"input_wires":[252], "output_wire":249, "operation":"not"},
    {"input_wires":[249,250], "output_wire":247, "operation":"and"},
    {"input_wires":[247], "output_wire":244, "operation":"not"},
    {"input_wires":[7,244], "output_wire":240, "operation":"xor"},
    {"input_wires":[244,246], "output_wire":245, "operation":"and"},
    {"input_wires":[39,240], "output_wire":413, "operation":"xor"},
    {"input_wires":[245], "output_wire":242, "operation":"not"},
    {"input_wires":[242,243], "output_wire":241, "operation":"and"},
    {"input_wires":[241], "output_wire":237, "operation":"not"},
    {"input_wires":[8,237], "output_wire":234, "operation":"xor"},
    {"input_wires":[237,239], "output_wire":238, "operation":"and"},
    {"input_wires":[40,234], "output_wire":414, "operation":"xor"},
    {"input_wires":[238], "output_wire":235, "operation":"not"},
    {"input_wires":[235,236], "output_wire":233, "operation":"and"},
    {"input_wires":[233], "output_wire":230, "operation":"not"},
    {"input_wires":[9,230], "output_wire":227, "operation":"xor"},
    {"input_wires":[230,232], "output_wire":231, "operation":"and"},
    {"input_wires":[41,227], "output_wire":415, "operation":"xor"},
    {"input_wires":[231], "output_wire":228, "operation":"not"},
    {"input_wires":[228,229], "output_wire":226, "operation":"and"},
    {"input_wires":[226], "output_wire":223, "operation":"not"},
    {"input_wires":[10,223], "output_wire":220, "operation":"xor"},
    {"input_wires":[223,225], "output_wire":224, "operation":"and"},
    {"input_wires":[42,220], "output_wire":416, "operation":"xor"},
    {"input_wires":[224], "output_wire":221, "operation":"not"},
    {"input_wires":[221,222], "output_wire":219, "operation":"and"},
    {"input_wires":[219], "output_wire":216, "operation":"not"},
    {"input_wires":[11,216], "output_wire":213, "operation":"xor"},
    {"input_wires":[216,218], "output_wire":217, "operation":"and"},
    {"input_wires":[43,213], "output_wire":417, "operation":"xor"},
    {"input_wires":[217], "output_wire":214, "operation":"not"},
    {"input_wires":[214,215], "output_wire":212, "operation":"and"},
    {"input_wires":[212], "output_wire":209, "operation":"not"},
    {"input_wires":[12,209], "output_wire":206, "operation":"xor"},
    {"input_wires":[209,211], "output_wire":210, "operation":"and"},
    {"input_wires":[44,206], "output_wire":418, "operation":"xor"},
    {"input_wires":[210], "output_wire":207, "operation":"not"},
    {"input_wires":[207,208], "output_wire":205, "operation":"and"},
    {"input_wires":[205], "output_wire":202, "operation":"not"},
    {"input_wires":[13,202], "output_wire":199, "operation":"xor"},
    {"input_wires":[202,204], "output_wire":203, "operation":"and"},
    {"input_wires":[45,199], "output_wire":419, "operation":"xor"},
    {"input_wires":[203], "output_wire":200, "operation":"not"},
    {"input_wires":[200,201], "output_wire":198, "operation":"and"},
    {"input_wires":[198], "output_wire":196, "operation":"not"},
    {"input_wires":[14,196], "output_wire":191, "operation":"xor"},
    {"input_wires":[196,197], "output_wire":195, "operation":"and"},
    {"input_wires":[46,191], "output_wire":420, "operation":"xor"},
    {"input_wires":[195], "output_wire":193, "operation":"not"},
    {"input_wires":[193,194], "output_wire":192, "operation":"and"},
    {"input_wires":[192], "output_wire":188, "operation":"not"},
    {"input_wires":[15,188], "output_wire":184, "operation":"xor"},
    {"input_wires":[188,190], "output_wire":189, "operation":"and"},
    {"input_wires":[47,184], "output_wire":421, "operation":"xor"},
    {"input_wires":[189], "output_wire":186, "operation":"not"},
    {"input_wires":[186,187], "output_wire":185, "operation":"and"},
    {"input_wires":[185], "output_wire":181, "operation":"not"},
    {"input_wires":[16,181], "output_wire":178, "operation":"xor"},
    {"input_wires":[181,183], "output_wire":182, "operation":"and"},
    {"input_wires":[48,178], "output_wire":422, "operation":"xor"},
    {"input_wires":[182], "output_wire":179, "operation":"not"},
    {"input_wires":[179,180], "output_wire":177, "operation":"and"},
    {"input_wires":[177], "output_wire":174, "operation":"not"},
    {"input_wires":[49,174], "output_wire":171, "operation":"xor"},
    {"input_wires":[174,176], "output_wire":175, "operation":"and"},
    {"input_wires":[17,171], "output_wire":423, "operation":"xor"},
    {"input_wires":[175], "output_wire":172, "operation":"not"},
    {"input_wires":[172,173], "output_wire":170, "operation":"and"},
    {"input_wires":[170], "output_wire":167, "operation":"not"},
    {"input_wires":[18,167], "output_wire":164, "operation":"xor"},
    {"input_wires":[167,169], "output_wire":168, "operation":"and"},
    {"input_wires":[50,164], "output_wire":424, "operation":"xor"},
    {"input_wires":[168], "output_wire":165, "operation":"not"},
    {"input_wires":[165,166], "output_wire":163, "operation":"and"},
    {"input_wires":[163], "output_wire":160, "operation":"not"},
    {"input_wires":[19,160], "output_wire":157, "operation":"xor"},
    {"input_wires":[160,162], "output_wire":161, "operation":"and"},
    {"input_wires":[51,157], "output_wire":425, "operation":"xor"},
    {"input_wires":[161], "output_wire":158, "operation":"not"},
    {"input_wires":[158,159], "output_wire":156, "operation":"and"},
    {"input_wires":[156], "output_wire":153, "operation":"not"},
    {"input_wires":[20,153], "output_wire":150, "operation":"xor"},
    {"input_wires":[153,155], "output_wire":154, "operation":"and"},
    {"input_wires":[52,150], "output_wire":426, "operation":"xor"},
    {"input_wires":[154], "output_wire":151, "operation":"not"},
    {"input_wires":[151,152], "output_wire":149, "operation":"and"},
    {"input_wires":[149], "output_wire":146, "operation":"not"},
    {"input_wires":[21,146], "output_wire":142, "operation":"xor"},
    {"input_wires":[146,148], "output_wire":147, "operation":"and"},
    {"input_wires":[53,142], "output_wire":427, "operation":"xor"},
    {"input_wires":[147], "output_wire":144, "operation":"not"},
    {"input_wires":[144,145], "output_wire":143, "operation":"and"},
    {"input_wires":[143], "output_wire":139, "operation":"not"},
    {"input_wires":[54,139], "output_wire":136, "operation":"xor"},
    {"input_wires":[139,141], "output_wire":140, "operation":"and"},
    {"input_wires":[22,136], "output_wire":428, "operation":"xor"},
    {"input_wires":[140], "output_wire":137, "operation":"not"},
    {"input_wires":[137,138], "output_wire":135, "operation":"and"},
    {"input_wires":[135], "output_wire":133, "operation":"not"},
    {"input_wires":[23,133], "output_wire":128, "operation":"xor"},
    {"input_wires":[133,134], "output_wire":132, "operation":"and"},
    {"input_wires":[55,128], "output_wire":429, "operation":"xor"},
    {"input_wires":[132], "output_wire":130, "operation":"not"},
    {"input_wires":[130,131], "output_wire":129, "operation":"and"},
    {"input_wires":[129], "output_wire":125, "operation":"not"},
    {"input_wires":[24,125], "output_wire":122, "operation":"xor"},
    {"input_wires":[125,127], "output_wire":126, "operation":"and"},
    {"input_wires":[56,122], "output_wire":430, "operation":"xor"},
    {"input_wires":[126], "output_wire":123, "operation":"not"},
    {"input_wires":[123,124], "output_wire":121, "operation":"and"},
    {"input_wires":[121], "output_wire":118, "operation":"not"},
    {"input_wires":[25,118], "output_wire":115, "operation":"xor"},
    {"input_wires":[118,120], "output_wire":119, "operation":"and"},
    {"input_wires":[57,115], "output_wire":431, "operation":"xor"},
    {"input_wires":[119], "output_wire":116, "operation":"not"},
    {"input_wires":[116,117], "output_wire":114, "operation":"and"},
    {"input_wires":[114], "output_wire":111, "operation":"not"},
    {"input_wires":[26,111], "output_wire":108, "operation":"xor"},
    {"input_wires":[111,113], "output_wire":112, "operation":"and"},
    {"input_wires":[58,108], "output_wire":432, "operation":"xor"},
    {"input_wires":[112], "output_wire":109, "operation":"not"},
    {"input_wires":[109,110], "output_wire":107, "operation":"and"},
    {"input_wires":[107], "output_wire":104, "operation":"not"},
    {"input_wires":[27,104], "output_wire":101, "operation":"xor"},
    {"input_wires":[104,106], "output_wire":105, "operation":"and"},
    {"input_wires":[59,101], "output_wire":433, "operation":"xor"},
    {"input_wires":[105], "output_wire":102, "operation":"not"},
    {"input_wires":[102,103], "output_wire":100, "operation":"and"},
    {"input_wires":[100], "output_wire":97, "operation":"not"},
    {"input_wires":[60,97], "output_wire":94, "operation":"xor"},
    {"input_wires":[97,99], "output_wire":98, "operation":"and"},
    {"input_wires":[28,94], "output_wire":434, "operation":"xor"},
    {"input_wires":[98], "output_wire":95, "operation":"not"},
    {"input_wires":[95,96], "output_wire":93, "operation":"and"},
    {"input_wires":[93], "output_wire":90, "operation":"not"},
    {"input_wires":[29,90], "output_wire":87, "operation":"xor"},
    {"input_wires":[90,92], "output_wire":91, "operation":"and"},
    {"input_wires":[61,87], "output_wire":435, "operation":"xor"},
    {"input_wires":[91], "output_wire":88, "operation":"not"},
    {"input_wires":[88,89], "output_wire":86, "operation":"and"},
    {"input_wires":[86], "output_wire":84, "operation":"not"},
    {"input_wires":[62,84], "output_wire":80, "operation":"xor"},
    {"input_wires":[84,85], "output_wire":83, "operation":"and"},
    {"input_wires":[30,80], "output_wire":436, "operation":"xor"},
    {"input_wires":[83], "output_wire":81, "operation":"not"},
    {"input_wires":[81,82], "output_wire":79, "operation":"and"},
    {"input_wires":[79], "output_wire":77, "operation":"not"},
    {"input_wires":[31,77], "output_wire":73, "operation":"xor"},
    {"input_wires":[77,78], "output_wire":76, "operation":"and"},
    {"input_wires":[63,73], "output_wire":437, "operation":"xor"},
    {"input_wires":[76], "output_wire":74, "operation":"not"},
    {"input_wires":[74,75], "output_wire":71, "operation":"and"},
    {"input_wires":[71,72], "output_wire":438, "operation":"xor"},
    {"input_wires":[71], "output_wire":69, "operation":"not"},
    {"input_wires":[69,70], "output_wire":68, "operation":"and"},
    {"input_wires":[68], "output_wire":66, "operation":"not"},
    {"input_wires":[66,67], "output_wire":65, "operation":"and"},
    {"input_wires":[65], "output_wire":439, "operation":"not"}
  ]
};

/**
 * Run pure (functions only) end-to-end execution of entire protocol.
 * @param {Object} circuit - Circuit to garble and evaluate
 * @param {Object} input1 - Bit vector for first input
 * @param {Object} input2 - Bit vector for second input
 * @returns {number[]} Computed bit vector output
 */
function protocolPureEndToEnd(circuit, input1, input2) {
  var chan = new channel.ChannelSimulated();

  // Steps performed by garbler.
  var wToLs_G = garble.generateWireToLabelsMap(circuit);
  var garbledGates = garble.garbleGates(circuit, wToLs_G);
  garble.sendInputWireToLabelsMap(chan, circuit, wToLs_G, input1.bits);
  chan.sendDirect('garbledGates', garbledGates.toJSONString());

  // Steps performed by evaluator.
  var messages = evaluate.receiveMessages(chan, circuit, input2.bits);
  var [garbledGates_E, wToL_E] = evaluate.processMessages(circuit, messages);
  var wToL_E2 = evaluate.evaluateGates(circuit, garbledGates_E, wToL_E)
                        .copyWithOnlyIndices(circuit.output_wires);
  var outputWireToLabels_E = wToL_E2.copyWithOnlyIndices(circuit.output_wires);
  chan.sendDirect('outputWireToLabels', outputWireToLabels_E.toJSONString());

  // Steps performed by garbler.
  var outputWireToLabels_G =
    association.fromJSONString(chan.receiveDirect('outputWireToLabels'));
  var output = garble.outputLabelsToBits(circuit, wToLs_G, outputWireToLabels_G);

  return new bits.Bits(output);
}

// The unit tests below do not require a cryptographic library.
describe('circuit-parser', function() {
  describe('#circuit.fromBristolFashion()', function () {
    it('circuit.fromBristolFashion', function() {
      expect(circuit.fromBristolFashion(and4_bristol).toJSON()).to.eql(and4_json);
      expect(circuit.fromBristolFashion(add32_bristol).toJSON()).to.eql(add32_json);
    });
  });
});

// The unit tests below assume that libsodium has been loaded.
global.sodium = require('libsodium-wrappers');
beforeEach(async function() {
  await sodium.ready; // Wait for libsodium to load.
});
describe('end-to-end', function() {
  it('and4_circuit', function() {
    var input1 = new bits.Bits("01"), input2 = new bits.Bits("10");
    var and4_circuit = circuit.fromBristolFashion(and4_bristol);
    var outEval = and4_circuit.evaluate([input1, input2]);
    var outEtoE = protocolPureEndToEnd(and4_circuit, input1, input2);
    expect(outEval.toString()).to.eql(outEtoE.toString());
  });

  for (var r = 0; r < 5*2; r += 2) {
    it('add32_circuit', function() {
      var input1 = bits.random(32, r);
      var input2 = bits.random(32, r + 1);
      var add32_circuit = circuit.fromBristolFashion(add32_bristol);
      var outEval = add32_circuit.evaluate([input1, input2]);
      var outEtoE = protocolPureEndToEnd(add32_circuit, input1, input2);
      expect(outEval.toString()).to.eql(outEtoE.toString());
    });
  }

  let filenames = [
    'universal_1bit.txt',
    'and4.txt', 'and8.txt',
    'adder_32bit.txt', 'adder_64bit.txt', 'sub64.txt',
    'comparator_32bit_signed_lt.txt',
    'zero_equal_64.txt'//, 'zero_equal_128.txt'
    //,'mult_32x32.txt', 'mult64.txt', 'divide64.txt'
  ];
  for (let i = 0; i < filenames.length; i++) {
    it(filenames[i], async function() {
      let raw = await fs.readFile('./circuits/bristol/' + filenames[i], 'utf8');
      let c = circuit.fromBristolFashion(raw);
      let input1 = bits.random(c.input_wires.length/2, 1);
      let input2 = bits.random(c.input_wires.length/2, 2);
      let outEval = c.evaluate([input1, input2]);
      let outEtoE = protocolPureEndToEnd(c, input1, input2);
      expect(outEval.toString()).to.eql(outEtoE.toString());
    });
  }
});
